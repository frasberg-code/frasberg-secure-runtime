import asyncio
import json
import logging

logger = logging.getLogger(__name__)


def guard_stream(gen, error_payloads, keepalive=15):
    """Wrap an SSE generator: never drop the connection on error, send keepalives during silence."""
    async def wrapped():
        queue = asyncio.Queue()

        async def produce():
            try:
                async for chunk in gen:
                    await queue.put(chunk)
            except Exception:
                logger.exception("SSE stream error — sending graceful payload")
                for p in error_payloads:
                    await queue.put(f"data: {json.dumps(p)}\n\n")
            finally:
                await queue.put(None)

        task = asyncio.create_task(produce())
        try:
            while True:
                try:
                    chunk = await asyncio.wait_for(queue.get(), timeout=keepalive)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
                    continue
                if chunk is None:
                    break
                yield chunk
        finally:
            task.cancel()

    return wrapped()
