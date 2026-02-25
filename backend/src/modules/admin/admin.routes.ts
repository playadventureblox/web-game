import { Router } from 'express';
import { requireAdmin, listUsers, deleteUser, listGroups, deleteGroup } from './admin.controller.js';

const router = Router();

router.use(requireAdmin);

router.get('/users', listUsers);
router.delete('/users/:userId', deleteUser);

router.get('/groups', listGroups);
router.delete('/groups/:groupId', deleteGroup);

export default router;
