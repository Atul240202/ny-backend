import AppConstant from '../models/appConstant.js';
import { logger } from '../utils/logger.js';

// GET /app-constants/:type/:stepId
export const getAppConstantStepById = async (req, res) => {
  try {
    const { type, stepId } = req.params;

    if (!type || !stepId) {
      return res.status(400).json({
        success: false,
        message: 'Type and stepId are required',
      });
    }

    const data = await AppConstant.findOne({
      type: type.toLowerCase().trim(),
      isActive: true,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found',
      });
    }

    const steps = data.value?.steps;

    if (!Array.isArray(steps)) {
      return res.status(400).json({
        success: false,
        message: 'Steps not found in configuration',
      });
    }

    const step = steps.find(s => s.id === stepId);

    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: step,
    });

  } catch (error) {
    logger.error('Get app constant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
