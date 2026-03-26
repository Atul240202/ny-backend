import { logger } from '../utils/logger.js';
import GuardrailLog from '../models/GuardrailLog.js';

// POST /api/v1/guardrail-logs/batch
export const batchUploadGuardrailLogs = async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: 'data array is required' });
    }

    // insertMany with ordered:false — skips duplicates (by unique id), continues rest
    const result = await GuardrailLog.insertMany(data, { ordered: false }).catch((err) => {
      // E11000 = duplicate key — still return what was inserted
      if (err.code === 11000) return err;
      throw err;
    });

    const inserted = result?.insertedCount ?? result?.length ?? 0;
    const duplicates = data.length - inserted;

    logger.info(`[GuardrailLogs] Batch: ${inserted} inserted, ${duplicates} duplicates`);

    return res.status(201).json({
      success: true,
      data: { inserted, duplicates },
    });
  } catch (error) {
    logger.error('[GuardrailLogs] Batch upload error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed' });
  }
};
