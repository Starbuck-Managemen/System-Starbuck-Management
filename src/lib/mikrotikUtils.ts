export function parseMikrotikDuration(durationStr: string): number {
  if (!durationStr) return 0;
  
  let totalMs = 0;
  const wMatch = durationStr.match(/(\d+)w/);
  if (wMatch) totalMs += parseInt(wMatch[1]) * 7 * 24 * 60 * 60 * 1000;
  
  const dMatch = durationStr.match(/(\d+)d/);
  if (dMatch) totalMs += parseInt(dMatch[1]) * 24 * 60 * 60 * 1000;
  
  const hMatch = durationStr.match(/(\d+)h/);
  if (hMatch) totalMs += parseInt(hMatch[1]) * 60 * 60 * 1000;
  
  const mMatch = durationStr.match(/(\d+)m/);
  if (mMatch) totalMs += parseInt(mMatch[1]) * 60 * 1000;
  
  const sMatch = durationStr.match(/(\d+)s/);
  if (sMatch) totalMs += parseInt(sMatch[1]) * 1000;
  
  return totalMs;
}

export function guessValidityFromProfile(name: string): number {
  if (!name) return 0;
  name = name.toUpperCase();
  
  const hMatch = name.match(/(\d+)H/);
  if (hMatch) return parseInt(hMatch[1]) * 60 * 60 * 1000;

  if (name.includes("HARI") || name.includes("1D")) return 24 * 60 * 60 * 1000;
  if (name === "CLIENT") return 30 * 24 * 60 * 60 * 1000;

  return 0;
}

export function guessOriginalProfile(user: any, priceMap: Map<string, number>): string {
  let limit = user["limit-uptime"] ? user["limit-uptime"].toLowerCase() : "";

  if (!limit || limit === "0s") {
    let lifeSpanDays = 0;
    if (user.comment) {
       const createdAtTs = parseMikrotikCommentDate(user.comment);
       if (createdAtTs) {
          lifeSpanDays = (Date.now() - createdAtTs) / (1000 * 60 * 60 * 24);
       }
    }

    if (lifeSpanDays >= 25) {
       limit = "30d";
    } else if (lifeSpanDays >= 6) {
       limit = "7d";
    } else if (user.uptime && user.uptime !== "0s") {
      const up = user.uptime.toLowerCase();
      let days = 0;
      let hours = 0;
      
      const wMatch = up.match(/(\d+)w/);
      if (wMatch) days += parseInt(wMatch[1]) * 7;
      
      const dMatch = up.match(/(\d+)d/);
      if (dMatch) days += parseInt(dMatch[1]);
      
      const hMatch = up.match(/(\d+)h/);
      if (hMatch) hours += parseInt(hMatch[1]);
      
      if (days > 0) {
         if (days >= 20) limit = "30d";
         else limit = `${days}d`;
      } else {
         const mMatch = up.match(/(\d+)m/);
         if (mMatch) hours += 1;
         if (hours === 0) hours = 1;
         limit = `${hours}h`;
      }
    } else {
      for (const profileName of priceMap.keys()) {
        if (profileName.toUpperCase().includes("BULAN")) return profileName;
      }
      return "1-BULAN";
    }
  }
  
  for (const profileName of priceMap.keys()) {
    const p = profileName.toLowerCase();
    for (let i = 1; i <= 24; i++) {
      if (limit.includes(`${i}h`) && p.includes(`${i}`) && p.includes("jam")) return profileName;
    }
    for (let i = 1; i <= 30; i++) {
      if (limit.includes(`${i}d`) && p.includes(`${i}`) && p.includes("hari")) return profileName;
    }
    if ((limit.includes("30d") || limit.includes("4w")) && (p.includes("30") || p.includes("bulan"))) return profileName;
  }

  if (limit.includes("30d") || limit.includes("4w")) return "1-BULAN";
  if (limit.includes("1d")) return "1-HARI";
  for (let i = 1; i <= 24; i++) {
    if (limit.includes(`${i}h`)) return `${i}-JAM`;
  }

  return user.profile;
}

export function parseMikrotikCommentDate(comment: string): number | null {
  if (!comment) return null;
  
  const monthMap: Record<string, string> = {
    'jan': 'Jan', 'feb': 'Feb', 'mar': 'Mar', 'apr': 'Apr', 'may': 'May', 'mei': 'May', 
    'jun': 'Jun', 'jul': 'Jul', 'aug': 'Aug', 'agt': 'Aug', 'sep': 'Sep', 'oct': 'Oct', 
    'okt': 'Oct', 'nov': 'Nov', 'dec': 'Dec', 'des': 'Dec'
  };

  try {
    let normalized = comment.replace(/\./g, ':');
    const match = normalized.match(/([a-zA-Z]{3})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2}:\d{2})/);
    if (match) {
      const monthStr = match[1].toLowerCase();
      const month = monthMap[monthStr] || match[1];
      const day = match[2];
      const year = match[3];
      const time = match[4];
      
      const dateStr = `${month} ${day}, ${year} ${time}`;
      const timestamp = Date.parse(dateStr);
      if (!isNaN(timestamp)) return timestamp;
    }
  } catch(e) {}
  
  return null;
}

export function enrichVoucher(user: any, priceMap: Map<string, number>) {
    let currentProfile = user.profile;

    if (currentProfile && currentProfile.toLowerCase().includes("peringatan")) {
      currentProfile = guessOriginalProfile(user, priceMap);
    }

    const price = priceMap.get(currentProfile) || 0;
    let validityMs = parseMikrotikDuration(user["limit-uptime"]) || guessValidityFromProfile(currentProfile);
    
    // Fallback Cerdas: Jika limit-uptime kosong dan nama profil tidak dikenali (misal: "Hostpot", "default"),
    // maka kita asumsikan ini adalah voucher bulanan (30 hari). Karena voucher jam-jaman pasti memiliki limit-uptime.
    if (validityMs === 0) {
      validityMs = 30 * 24 * 60 * 60 * 1000;
    }
    
    const now = new Date();
    let createdAtTimestamp = now.getTime();
    let expiresAtTimestamp: number | null = null;
    
    if (user.comment) {
      if (user.comment.includes("Created:")) {
        const match = user.comment.match(/Created:(\d+)/);
        if (match && match[1]) {
          createdAtTimestamp = parseInt(match[1]);
        }
      } else {
        const parsedTs = parseMikrotikCommentDate(user.comment);
        if (parsedTs) {
          if (validityMs >= 7 * 24 * 60 * 60 * 1000) {
             expiresAtTimestamp = parsedTs;
             createdAtTimestamp = expiresAtTimestamp - validityMs;
          } else {
             createdAtTimestamp = parsedTs;
             expiresAtTimestamp = createdAtTimestamp + validityMs;
          }
        }
      }
    }

    if (!expiresAtTimestamp && validityMs > 0) {
      expiresAtTimestamp = createdAtTimestamp + validityMs;
    }

    return {
        actualProfile: currentProfile,
        price,
        createdAt: new Date(createdAtTimestamp),
        expiresAt: expiresAtTimestamp ? new Date(expiresAtTimestamp) : null
    };
}
