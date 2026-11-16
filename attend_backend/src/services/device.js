const os = require("os");
const net = require("net");
const Zkteco = require("zkteco-js");
const { getSetting, setSetting } = require("./settings");
require("dotenv").config();

const ZK_PORT = parseInt(process.env.ZK_PORT, 10) || 4370;
const ZK_TIMEOUT = parseInt(process.env.ZK_TIMEOUT, 10) || 10000;
const ZK_INOUT = parseInt(process.env.ZK_INOUT, 10) || 4000;
const PROBE_TIMEOUT = 400; // ms per IP
const SCAN_BATCH = 32;
const REALTIME_RETRY_MS = 30000;

const status = {
  connected: false,
  ip: null,
  lastConnectedAt: null,
  lastError: null,
};

// Resolves true if something accepts a TCP connection on ip:ZK_PORT
const probe = (ip) =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(PROBE_TIMEOUT);
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
    socket.connect(ZK_PORT, ip);
  });

// Local subnet prefix, e.g. '192.168.1'
const getLocalSubnet = () => {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address.split(".").slice(0, 3).join(".");
      }
    }
  }
  return null;
};

// Scan the local subnet in parallel batches for a device on ZK_PORT
const discoverIP = async () => {
  const subnet = getLocalSubnet();
  if (!subnet) return null;
  console.log(`Scanning ${subnet}.0/24 for ZKTeco device on port ${ZK_PORT}`);
  for (let start = 1; start < 255; start += SCAN_BATCH) {
    const ips = [];
    for (let i = start; i < Math.min(start + SCAN_BATCH, 255); i++) {
      ips.push(`${subnet}.${i}`);
    }
    const results = await Promise.all(ips.map(probe));
    const hit = ips.find((_, i) => results[i]);
    if (hit) return hit;
  }
  return null;
};

// Use the saved / configured IP when it answers; scan only as a fallback
const resolveIP = async () => {
  const candidates = [getSetting("zk_ip"), process.env.ZK_IP].filter(Boolean);
  for (const ip of new Set(candidates)) {
    if (await probe(ip)) return ip;
  }
  const found = await discoverIP();
  if (!found) throw new Error("ZKTeco device not found on the network");
  console.log("Device found at IP:", found);
  setSetting("zk_ip", found);
  return found;
};

const openDevice = async (cbErr, cbClose) => {
  const ip = await resolveIP();
  const device = new Zkteco(ip, ZK_PORT, ZK_TIMEOUT, ZK_INOUT);
  await device.createSocket(cbErr, cbClose);
  await device.enableDevice();
  return { device, ip };
};

// Serialise command connections: the device handles one request at a time
let queue = Promise.resolve();

const withDevice = (fn) => {
  const run = queue.then(async () => {
    let device;
    try {
      const opened = await openDevice();
      device = opened.device;
      const result = await fn(device);
      Object.assign(status, {
        connected: true,
        ip: opened.ip,
        lastConnectedAt: new Date().toISOString(),
        lastError: null,
      });
      return result;
    } catch (error) {
      Object.assign(status, { connected: false, lastError: error.message });
      throw error;
    } finally {
      if (device) await device.disconnect().catch(() => {});
    }
  });
  queue = run.catch(() => {});
  return run;
};

// Long-lived connection for live punches; reconnects when it drops
const startRealTime = (onLog) => {
  let retryTimer = null;
  const scheduleRetry = () => {
    if (retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      connect();
    }, REALTIME_RETRY_MS);
  };

  const connect = async () => {
    try {
      const { device, ip } = await openDevice(scheduleRetry, scheduleRetry);
      await device.getRealTimeLogs(onLog);
      console.log(`Listening for real-time logs from ${ip}`);
    } catch (error) {
      console.error("Real-time connection failed:", error.message);
      scheduleRetry();
    }
  };

  connect();
};

const getStatus = () => ({ ...status });

module.exports = { withDevice, startRealTime, getStatus };
