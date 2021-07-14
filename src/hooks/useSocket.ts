import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const urlParams = new URLSearchParams(window.location.search);
const customURL = urlParams.get("url");
const socketURL =
  customURL ||
  (process.env.NODE_ENV === "development"
    ? "http://" + window.location.hostname + ":5000"
    : "/");
console.log("connecting: ", socketURL);

function useSocket() {
  const [state, set] = useState<Socket>();

  useEffect(() => {
    console.log("socket reset!");

    const socket = io(socketURL, {
      path: "/socket",
      forceNew: true,
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("connected", socket.id, socket);
      set(socket);
    });

    socket.on("disconnect", () => {
      console.log("diconnected", socket);
      set(socket);
    });
  }, []);

  return state;
}

export default useSocket;
