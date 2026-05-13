def validate_audio_chunk(
    audio_chunk : bytes,
) -> bool :
    return bool(audio_chunk)

def normalize_transcript(
    transcript : str
) -> str :
    return transcript.strip()