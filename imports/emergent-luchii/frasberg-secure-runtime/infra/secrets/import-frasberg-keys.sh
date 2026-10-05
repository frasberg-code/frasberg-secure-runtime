#!/usr/bin/env bash
set -euo pipefail

region="${AWS_REGION:-us-west-2}"
secret_name="${ENGINE_KEYS_SECRET_NAME:-frasberg/runtime/engine-keys}"

: "${FRB_MUSIC_GENERATION_KEY:?Set FRB_MUSIC_GENERATION_KEY}"
: "${FRB_MUSIC_ENGINE_KEY:?Set FRB_MUSIC_ENGINE_KEY}"
: "${FRB_IMAGE_VIDEO_GENERATION_KEY:?Set FRB_IMAGE_VIDEO_GENERATION_KEY}"
: "${FRB_VIDEO_ENGINE_KEY:?Set FRB_VIDEO_ENGINE_KEY}"
: "${FRB_AUDIO_TOOLS_KEY:?Set FRB_AUDIO_TOOLS_KEY}"
: "${FRB_VOICE_CLONING_KEY:?Set FRB_VOICE_CLONING_KEY}"
: "${FRB_GATEWAY_STT_KEY:?Set FRB_GATEWAY_STT_KEY}"
: "${FRB_GATEWAY_TTS_KEY:?Set FRB_GATEWAY_TTS_KEY}"

if aws secretsmanager describe-secret \
  --secret-id "$secret_name" \
  --region "$region" >/dev/null 2>&1; then
  echo "Secret '$secret_name' already exists; refusing to overwrite it." >&2
  exit 1
fi

secret_string="$(jq -cn \
  --arg music_generation "$FRB_MUSIC_GENERATION_KEY" \
  --arg music_engine "$FRB_MUSIC_ENGINE_KEY" \
  --arg image_video_generation "$FRB_IMAGE_VIDEO_GENERATION_KEY" \
  --arg video_engine "$FRB_VIDEO_ENGINE_KEY" \
  --arg audio_tools "$FRB_AUDIO_TOOLS_KEY" \
  --arg voice_cloning "$FRB_VOICE_CLONING_KEY" \
  --arg gateway_stt "$FRB_GATEWAY_STT_KEY" \
  --arg gateway_tts "$FRB_GATEWAY_TTS_KEY" \
  '{
    FRB_MUSIC_GENERATION_KEY:$music_generation,
    FRB_MUSIC_ENGINE_KEY:$music_engine,
    FRB_IMAGE_VIDEO_GENERATION_KEY:$image_video_generation,
    FRB_VIDEO_ENGINE_KEY:$video_engine,
    FRB_AUDIO_TOOLS_KEY:$audio_tools,
    FRB_VOICE_CLONING_KEY:$voice_cloning,
    FRB_GATEWAY_STT_KEY:$gateway_stt,
    FRB_GATEWAY_TTS_KEY:$gateway_tts
  }')"

aws secretsmanager create-secret \
  --name "$secret_name" \
  --secret-string "$secret_string" \
  --region "$region" \
  --query ARN \
  --output text
