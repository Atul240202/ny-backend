import mongoose from 'mongoose';

const guardrailLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // client-generated dedup id
    triggered_at_ist: { type: String, required: true },
    heart_rate: { type: Number, default: null },
    should_play: { type: Boolean, required: true },
    block_reason: { type: String, default: null },
    is_moving: { type: Boolean, default: null },
    is_speaking: { type: Boolean, default: null },
    has_audio_route: { type: Boolean, default: null },
    other_audio_playing: { type: Boolean, default: null },
    volume_audible: { type: Boolean, default: null },
    is_driving: { type: Boolean, default: null },
    guard_duration_ms: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'guardraillogs',
  },
);

guardrailLogSchema.index({ triggered_at_ist: -1 });
guardrailLogSchema.index({ should_play: 1 });
guardrailLogSchema.index({ block_reason: 1 });

export default mongoose.model('GuardrailLog', guardrailLogSchema);
