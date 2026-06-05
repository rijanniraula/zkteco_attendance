const { PART_TIME_UIDS, STAFF_UIDS } = require("../config/constants");

const os = require('os');
const net = require('net');

// Helper to get local subnet (e.g., '192.168.1')
const getLocalSubnet = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.');
        parts.pop(); // remove last octet
        return parts.join('.');
      }
    }
  }
  return null;
};

// Scan the local subnet for a device responding on ZK_PORT
const discoverZKIP = async () => {
  const subnet = getLocalSubnet();
  console.log('Subnet detected:', subnet);
  if (!subnet) return null;
  const timeout = 300; // ms per attempt
  for (let i = 1; i < 255; i++) {
    const ip = `${subnet}.${i}`;
    console.log('Attempting IP:', ip);
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        socket.once('connect', () => {
          console.log('Device found at IP:', ip);
          socket.destroy();
          resolve(ip);
        });
        socket.once('error', () => {
          socket.destroy();
          reject();
        });
        socket.once('timeout', () => {
          socket.destroy();
          reject();
        });
        socket.connect(parseInt(process.env.ZK_PORT, 10) || 4370, ip);
      });
      // If we reach here, the IP responded
      return ip;
    } catch (_) {
      // ignore and continue scanning
    }
  }
  return null;
};

const ZK_PORT = parseInt(process.env.ZK_PORT, 10) || 4370;
const ZK_TIMEOUT = parseInt(process.env.ZK_TIMEOUT, 10) || 10000;
const ZK_INOUT = parseInt(process.env.ZK_INOUT, 10) || 4000;

const connectDevice = async () => {
  const Zkteco = require("zkteco-js");
  const dynamicIP = await discoverZKIP();
  const ip = dynamicIP || process.env.ZK_IP;
  const device = new Zkteco(`${ip}`, ZK_PORT, ZK_TIMEOUT, ZK_INOUT);
  await device.createSocket();
  await device.enableDevice();

  return device;
};

const isStaff = (uid) => {
  if (STAFF_UIDS.includes(uid)) {
    return true;
  }
  return false;
};

const isPartTime = (uid) => {
  if (PART_TIME_UIDS.includes(uid)) {
    return true;
  }
  return false;
};

const checkAttendanceTime = (time, userId) => {
  // Part-time employees can come any time
  if (userId !== undefined && isPartTime(parseInt(userId, 10))) {
    return {
      isLate: false,
      status: "On Time",
    };
  }

  const attDate = new Date(time);
  const dayOfWeek = attDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
  const hour = attDate.getHours();
  const minute = attDate.getMinutes();
  const second = attDate.getSeconds();

  // Staff: 8:45 AM start time
  // Others: 9:41 AM start time
  const isStaffMember = userId !== undefined && isStaff(parseInt(userId, 10));
  const startHour = isStaffMember ? 8 : 9;
  const startMinute = isStaffMember ? 45 : 41;

  // Sunday to Thursday (0-4): end at 4:00 PM
  // Friday (5): end at 1:30 PM
  const isFriday = dayOfWeek === 5;
  const endHour = isFriday ? 13 : 16; // 1:30 PM for Friday, 4:00 PM for others
  const endMinute = isFriday ? 15 : 0;
  const endSecond = isFriday ? 0 : 0;

  // Check if time is after start time
  const isAfterStart =
    hour > startHour || (hour === startHour && minute >= startMinute);

  // Check if time is after end time
  const isAfterEnd =
    hour > endHour ||
    (hour === endHour && minute > endMinute) ||
    (hour === endHour && minute === endMinute && second > endSecond);

  // If after start time (but before/at end time) -> Late
  // If after end time -> Early (missed the window)
  // If before start time -> Early (on time)
  let status;
  let isLate = false;

  if (isAfterEnd) {
    status = "Early"; // After end time
    isLate = false;
  } else if (isAfterStart) {
    status = "Late"; // After start time but within range
    isLate = true;
  } else {
    status = "Early"; // Before start time (on time)
    isLate = false;
  }

  return {
    isLate,
    status,
  };
};

module.exports = {
  connectDevice,
  isStaff,
  isPartTime,
  checkAttendanceTime,
};
