import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const controller = new AuthController();

router.post('/guest', controller.createGuest);
router.post('/refresh', controller.refresh);

export default router;