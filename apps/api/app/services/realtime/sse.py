from sse_starlette.sse import EventSourceResponse

def create_sse(generator):
    return EventSourceResponse(generator)
    