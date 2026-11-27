import { Router } from 'express';
import { uploadAudio } from '../middlewares/upload.js';
import {
  processMeetingAudio,
  getAllMeetings,
  getMeetingById,
  toggleActionItemStatus,
  deleteMeeting,
} from '../controllers/meetingController.js';

const router = Router();

router.post('/process', uploadAudio.single('audio'), processMeetingAudio);
router.get('/', getAllMeetings);
router.get('/:id', getMeetingById);
router.patch('/:id/actions/:itemId', toggleActionItemStatus);
router.delete('/:id', deleteMeeting);

export default router;
