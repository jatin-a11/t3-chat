"use client";

let pusherInstance: any = null;

export function getPusherClient() {
  if (pusherInstance) return pusherInstance;

  const PusherJs = require("pusher-js");
  const PusherClass = PusherJs.default || PusherJs;

  pusherInstance = new PusherClass(
    process.env.NEXT_PUBLIC_PUSHER_KEY!,
    {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    }
  );

  return pusherInstance;
}