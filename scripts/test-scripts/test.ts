import { guessValidityFromProfile, enrichVoucher } from "./src/lib/mikrotikUtils.ts"

const user = {
    profile: "1-MINGGU",
    limitUptime: "8d",
    uptime: "0s",
    comment: "buckNet-gen-12345"
}

const priceMap = new Map()

const result = enrichVoucher(user, priceMap)
console.log(result)
