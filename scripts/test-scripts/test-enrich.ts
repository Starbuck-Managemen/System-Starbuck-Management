import { enrichVoucher } from "./src/lib/mikrotikUtils"

const user = {
  '$$path': '/ip/hotspot/user',
  id: '*71',
  server: 'hotspot1',
  name: '72GW',
  password: '72GW',
  profile: '1-JAM-FREE',
  limitUptime: '1h',
  uptime: '0s',
  comment: 'buckNet-gen-1783833941'
}

const priceMap = new Map();
const enriched = enrichVoucher(user, priceMap);
console.log(enriched);
