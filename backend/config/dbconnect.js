const mongoose = require("mongoose");
const dns = require("dns");
const os = require("os");

// Workaround: on some Windows setups Node resolves DNS via a stale/nonexistent
// 127.0.0.1 resolver instead of the actual network DNS servers, which breaks
// the SRV lookup used by mongodb+srv:// URIs (ECONNREFUSED on querySrv).
// If that's the case, fall back to the default gateway as the DNS server.
const ensureWorkingDnsResolver = () => {
  const servers = dns.getServers();
  const onlyLoopback = servers.every((s) => s === "127.0.0.1" || s === "::1");
  if (!onlyLoopback) return;

  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        // Assume the router (x.x.x.1) doubles as a DNS resolver — true for
        // most home/office setups and matches this project's environment.
        const gateway = iface.address.replace(/\.\d+$/, ".1");
        dns.setServers([gateway]);
        console.warn(
          `[dbconnect] Node's DNS resolver was only ${servers.join(", ")}; switched to ${gateway} to fix mongodb+srv lookups.`
        );
        return;
      }
    }
  }
};

const connectDB = async () => {
  try {
    ensureWorkingDnsResolver();
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
