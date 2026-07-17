function parseMikrotikTime(timeStr) {
  if (!timeStr) return 0;
  let totalSeconds = 0;
  const regex = /(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
  const matches = timeStr.match(regex);
  if (matches) {
    if (matches[1]) totalSeconds += parseInt(matches[1]) * 7 * 24 * 3600;
    if (matches[2]) totalSeconds += parseInt(matches[2]) * 24 * 3600;
    if (matches[3]) totalSeconds += parseInt(matches[3]) * 3600;
    if (matches[4]) totalSeconds += parseInt(matches[4]) * 60;
    if (matches[5]) totalSeconds += parseInt(matches[5]);
  }
  return totalSeconds;
}

const v = {
  disabled: false,
  expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  createdAt: new Date(), // now
  limitUptime: '1h',
  uptime: '0s',
  isActive: false
};

const getVoucherStatus = (v) => {
  if (v.disabled) return "NONAKTIF";
  
  let isExpiringSoon = false;
  const now = new Date().getTime();
  
  if (v.expiresAt) {
    const expiresTime = new Date(v.expiresAt).getTime();
    const createdTime = v.createdAt ? new Date(v.createdAt).getTime() : 0;
    const totalLifespan = expiresTime - createdTime;
    const timeRemaining = expiresTime - now;
    
    console.log({totalLifespan, timeRemaining});

    if (timeRemaining > 0) {
      if (totalLifespan > 7 * 24 * 60 * 60 * 1000) {
        if (timeRemaining <= 48 * 60 * 60 * 1000) isExpiringSoon = true;
      } else if (totalLifespan > 0) {
        if (timeRemaining <= totalLifespan * 0.2) isExpiringSoon = true;
      }
    } else {
       return "KADALUARSA";
    }
  } else if (v.limitUptime) {
    const limitSec = parseMikrotikTime(v.limitUptime);
    const upSec = parseMikrotikTime(v.uptime);
    if (limitSec > 0 && limitSec - upSec <= 3600) isExpiringSoon = true;
  }

  if (isExpiringSoon) return "HAMPIR HABIS";
  if (v.isActive) return "ACTIVE";
  if (v.uptime === "0s") return "BELUM DIPAKAI";
  return "OFFLINE";
};

console.log("Status:", getVoucherStatus(v));
