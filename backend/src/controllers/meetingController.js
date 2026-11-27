import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import Meeting from '../models/Meeting.js';
import { transcribeAudio } from '../services/whisperService.js';
import { extractMeetingIntelligence } from '../services/geminiService.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildFallbackTitle(originalFileName) {
  const baseName = path.basename(originalFileName, path.extname(originalFileName));
  const cleaned = baseName.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || 'Untitled Meeting';
}

function validateObjectId(id, res) {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid meeting ID format.' });
    return false;
  }
  return true;
}

/**
 * POST /api/meetings/process
 * Transcribe uploaded audio via Groq Whisper, extract structured insights via Gemini,
 * persist the Meeting document in MongoDB, and clean up the temporary file.
 */
export async function processMeetingAudio(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'An audio file is required (field name: "audio").',
    });
  }

  const filePath = req.file.path;

  try {
    const cleanFallbackTitle = buildFallbackTitle(req.file.originalname);
    const { transcript, durationSeconds } = await transcribeAudio(filePath);
    const intelligence = await extractMeetingIntelligence(transcript, cleanFallbackTitle);

    const meeting = await Meeting.create({
      title: intelligence.title,
      originalFileName: req.file.originalname,
      fileSizeBytes: req.file.size,
      durationSeconds,
      transcript,
      executiveOverview: intelligence.executiveOverview,
      keyDecisions: intelligence.keyDecisions,
      actionItems: intelligence.actionItems,
    });

    return res.status(201).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    return next(error);
  } finally {
    await fs.unlink(filePath).catch(() => {});
  }
}

/**
 * GET /api/meetings
 * List meetings sorted newest-first with optional partial search across
 * title, executiveOverview, and transcript. Excludes transcript field in list payload.
 */
export async function getAllMeetings(req, res, next) {
  try {
    const searchQuery = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const filter = {};

    if (searchQuery) {
      const regex = new RegExp(escapeRegex(searchQuery), 'i');
      filter.$or = [
        { title: regex },
        { executiveOverview: regex },
        { transcript: regex },
      ];
    }

    const meetings = await Meeting.find(filter)
      .select('-transcript')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/meetings/:id
 * Fetch a full Meeting document including transcript.
 */
export async function getMeetingById(req, res, next) {
  try {
    const { id } = req.params;
    if (!validateObjectId(id, res)) return;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/meetings/:id/actions/:itemId
 * Toggle an action item's status between Pending and Completed.
 */
export async function toggleActionItemStatus(req, res, next) {
  try {
    const { id, itemId } = req.params;
    if (!validateObjectId(id, res)) return;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    const actionItem = meeting.actionItems.id(itemId);
    if (!actionItem) {
      return res.status(404).json({
        success: false,
        message: 'Action item not found.',
      });
    }

    actionItem.status = actionItem.status === 'Completed' ? 'Pending' : 'Completed';
    await meeting.save();

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/meetings/:id
 * Delete a Meeting document by ID.
 */
export async function deleteMeeting(req, res, next) {
  try {
    const { id } = req.params;
    if (!validateObjectId(id, res)) return;

    const deleted = await Meeting.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Meeting deleted',
    });
  } catch (error) {
    return next(error);
  }
}
