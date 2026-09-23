import type { APIRoute } from "astro";
import { bus } from "../../lib/events";

// Enrolment changes, streamed to every open tab. A tab reloads only for its
// own student (see the subscriber in index.astro), but the stream itself is
// broadcast — there is no per-connection filtering here, so nothing in the
// payload should be anything a signed-in user shouldn't see.
export const GET: APIRoute = () => {
  let onEnrolment: (change: unknown) => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<string>({
    start(controller) {
      // an opening comment so the client (and the post-deploy CI probe) sees
      // bytes immediately, and a periodic one so proxies don't drop the
      // connection as idle
      controller.enqueue(": connected\n\n");
      heartbeat = setInterval(() => controller.enqueue(": ping\n\n"), 30_000);
      onEnrolment = (change) => {
        controller.enqueue(`data: ${JSON.stringify(change)}\n\n`);
      };
      bus.on("enrolment", onEnrolment);
    },
    cancel() {
      clearInterval(heartbeat);
      bus.off("enrolment", onEnrolment);
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
};
