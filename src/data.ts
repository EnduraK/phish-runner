export interface Scenario {
  id: number;
  type: string;
  icon: string;
  message: string;
  answer: 'Safe' | 'Suspicious';
  flags: string[];
  rule: string;
  feedback: string;
  cybok: string;
  breakdown: {
    targetCue: string;
    attackVector: string;
    countermeasure: string;
  };
}

export interface LevelConfig {
  name: string;
  icon: string;
  ms: number;
  lives: number;
  mult: number;
  blurb: string;
  accent: string;
}

// ... Keep your export const LEVELS = [...] and export const SCENARIOS = [...] down here!

export const LEVELS: LevelConfig[] = [
  { name: "Beginner", icon: "ti-seeding", ms: 9000, lives: 5, mult: 1, blurb: "Slow pace, 5 lives. Great for first-timers.", accent: "safe" },
  { name: "Regular", icon: "ti-walk", ms: 6500, lives: 4, mult: 2, blurb: "Normal speed, 4 lives. 2x points.", accent: "blue" },
  { name: "Expert", icon: "ti-run", ms: 4800, lives: 3, mult: 3, blurb: "Fast pace, 3 lives. 3x points.", accent: "amber" },
  { name: "Cyber Sprint", icon: "ti-bolt", ms: 3400, lives: 3, mult: 5, blurb: "Very fast, 3 lives. 5x points.", accent: "sus" }
];

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    type: "BANK TEXT",
    icon: "ti-building-bank",
    message: "ANZ: suspicious login detected. Verify now at anz-secure-verify.com or we freeze your account.",
    answer: "Suspicious",
    flags: ["Authority", "Urgency", "Fake domain"],
    rule: "Open your bank app yourself - never trust links in texts.",
    feedback: "Authority cue (a bank) + urgency - classic levers from CyBOK Human Factors KA. The off-brand domain is a Delivery-step lure.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "anz-secure-verify.com",
      attackVector: "Delivery-step lure (Cyber Kill Chain)",
      countermeasure: "Open your bank app or type the known URL yourself. Banks never push verification through SMS links."
    }
  },
  {
    id: 2,
    type: "IT HELPDESK",
    icon: "ti-mail-cog",
    message: "IT: your mailbox is full. Re-login at login-uni-edu.support-portal.net within 24h.",
    answer: "Suspicious",
    flags: ["Pretexting", "SSO risk", "Credential theft"],
    rule: "Real IT never asks you to log in through an email link.",
    feedback: "Pretexting - a fake IT scenario to gain trust (Adversarial Behaviours KA), plus urgency. One login unlocks many services via SSO.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "login-uni-edu.support-portal.net",
      attackVector: "Credential-harvesting pretexting",
      countermeasure: "Open the institution's portal from a bookmark. Real IT does not authenticate users through email links."
    }
  },
  {
    id: 3,
    type: "SOCIAL MEDIA DM",
    icon: "ti-message-circle",
    message: "It's Sarah! Lost my phone - forward me the SMS code I just sent you? Hurry!",
    answer: "Suspicious",
    flags: ["Hacked account", "2FA theft", "Pressure"],
    rule: "Never forward a verification code to anyone. Ever.",
    feedback: "Networked-privacy attack: a hacked friend's account as a trusted channel. The SMS-code ask is 2FA theft.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "request to forward an SMS / 2FA code",
      attackVector: "Networked-privacy attack (2FA theft)",
      countermeasure: "Never forward a verification code to anyone. Verify out-of-band - call the friend on a known number."
    }
  },
  {
    id: 4,
    type: "DELIVERY",
    icon: "ti-package",
    message: "AusPost: parcel held. Pay the $2.99 customs fee at auspost.parcel-redelivery.info",
    answer: "Suspicious",
    flags: ["Tiny-fee bait", "Fake domain", "Urgency"],
    rule: "Tiny fees are still phishing. Track in the official app.",
    feedback: "A tiny fee exploits bounded rationality - people skip judgement on 'trivial' sums (Human Factors KA). Off-brand domain.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "auspost.parcel-redelivery.info + $2.99 fee",
      attackVector: "Bounded-rationality bait (tiny-amount lure)",
      countermeasure: "Track parcels only via the carrier's official app or your order email. Tiny fees are still phishing."
    }
  },
  {
    id: 5,
    type: "PRIZE",
    icon: "ti-gift",
    message: "You won a free iPhone 15! Enter your Apple ID at apple-au-rewards.win to claim.",
    answer: "Suspicious",
    flags: ["Baiting", "Reward lure", "Credential theft"],
    rule: "If a prize wants your password, it's credential theft.",
    feedback: "Baiting - 'offering items to lure victims' is named in CyBOK's Adversarial Behaviours KA. The Apple ID ask is credential theft.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "apple-au-rewards.win + Apple ID request",
      attackVector: "Baiting + credential harvesting",
      countermeasure: "If a prize wants your password, it is credential theft. Genuine sweepstakes never need account credentials."
    }
  },
  {
    id: 6,
    type: "LECTURER",
    icon: "ti-school",
    message: "Dr Pahee: the Week 10 brief is on the portal. Log in directly - I won't send you links.",
    answer: "Safe",
    flags: ["Official portal", "No link", "NEAT-compliant"],
    rule: "Messages that tell you NOT to click are usually safe.",
    feedback: "Safe. It defuses social engineering by telling you NOT to click and to navigate independently - the NEAT pattern (Human Factors KA).",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "explicit 'log in directly - no links' instruction",
      attackVector: "Safe message imitating NEAT-compliant guidance",
      countermeasure: "When a message tells you NOT to click and to navigate by yourself, treat that as a green flag."
    }
  },
  {
    id: 7,
    type: "PASSWORD",
    icon: "ti-lock",
    message: "Microsoft: your password expires today. Renew at account.rnicrosoft.com",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Urgency", "Credential theft"],
    rule: "Hover-check every domain. Letters can lie (r+n looks like m).",
    feedback: "'rnicrosoft' uses r+n to imitate 'm' - a look-alike domain (Adversarial Behaviours KA). Time pressure makes us miss it.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "account.rnicrosoft.com (r+n imitates m)",
      attackVector: "Look-alike domain / typo-squatting",
      countermeasure: "Hover-check every domain. Password renewals must happen at the real account.microsoft.com only."
    }
  },
  {
    id: 8,
    type: "HMRC TAX",
    icon: "ti-receipt-tax",
    message: "HMRC: You're due a £247.83 refund. Claim within 24h at hmrc-gov-refund.uk/claim",
    answer: "Suspicious",
    flags: ["Authority", "Refund bait", "Fake gov domain"],
    rule: "HMRC never texts about refunds. Log in directly if unsure.",
    feedback: "HMRC never texts about refunds and never uses third-party domains. Authority impersonation + urgency.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "hmrc-gov-refund.uk (not gov.uk)",
      attackVector: "Government / authority impersonation",
      countermeasure: "HMRC never texts or emails about refunds. Log into your real HMRC account directly if unsure."
    }
  },
  {
    id: 9,
    type: "JOB OFFER",
    icon: "ti-briefcase",
    message: "LinkedIn recruiter: £85k remote role. Reply with your CV + scanned ID to verify@global-talent-hire.co",
    answer: "Suspicious",
    flags: ["ID document", "Pretexting", "Identity theft"],
    rule: "No real recruiter asks for ID before an interview.",
    feedback: "Real recruiters do not need scanned ID up front. CV + ID = identity-theft kit.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "ID-document request before any interview",
      attackVector: "Recruitment pretext / identity theft",
      countermeasure: "Verify recruiters via LinkedIn's official messaging. Never send ID until a verified offer is in place."
    }
  },
  {
    id: 10,
    type: "NETFLIX BILLING",
    icon: "ti-credit-card",
    message: "Netflix: payment failed. Update your card at netflix.account-pay.com or your subscription ends today.",
    answer: "Suspicious",
    flags: ["Fake domain", "Urgency", "Card-update bait"],
    rule: "Open Netflix directly. They never push card updates by SMS.",
    feedback: "Real Netflix domain is netflix.com. The off-brand 'account-pay.com' is a Delivery-step lure.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "netflix.account-pay.com",
      attackVector: "Subscription-renewal pretext",
      countermeasure: "Open the Netflix app or netflix.com directly. Streaming services never push card updates by SMS."
    }
  },
  {
    id: 11,
    type: "CRYPTO",
    icon: "ti-currency-bitcoin",
    message: "ATTENTION: You have 0.5 BTC unclaimed. Claim at coinbase-wallet-claim.io within 48h.",
    answer: "Suspicious",
    flags: ["Baiting", "Fake wallet", "Seed-phrase theft"],
    rule: "Free crypto isn't free. Never share a seed phrase.",
    feedback: "Free crypto = baiting. The off-brand domain is set up to harvest your wallet seed phrase.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "0.5 BTC + coinbase-wallet-claim.io",
      attackVector: "Baiting + wallet credential harvest",
      countermeasure: "Crypto never lands unclaimed in your wallet. Never enter a seed phrase at any URL pushed to you."
    }
  },
  {
    id: 12,
    type: "INVOICE",
    icon: "ti-file",
    message: "Invoice #4423 attached. Open invoice.pdf.exe to view your payment details.",
    answer: "Suspicious",
    flags: ["Double extension", "Malware", "Attachment risk"],
    rule: "Real PDFs end in .pdf - not .pdf.exe.",
    feedback: "Double extension '.pdf.exe' is a malware payload masquerading as a document.",
    cybok: "Malware & Attack Tech KA",
    breakdown: {
      targetCue: "invoice.pdf.exe (double extension)",
      attackVector: "Malware-by-attachment (Trojan)",
      countermeasure: "Never run executables from email. Legitimate PDFs end in .pdf, full stop."
    }
  },
  {
    id: 13,
    type: "TECH SUPPORT",
    icon: "ti-shield-x",
    message: "Microsoft Defender: 3 viruses detected. Call +44 800 002 5550 immediately to remove.",
    answer: "Suspicious",
    flags: ["Fake antivirus", "Phone scam", "Vishing"],
    rule: "Real antivirus never asks you to call a number.",
    feedback: "Real antivirus never asks you to phone a number. Phone-based tech-support scam.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "phone-a-number popup",
      attackVector: "Tech-support phone scam (vishing)",
      countermeasure: "Close the browser tab. Real antivirus never asks you to call. Open Windows Security directly to check."
    }
  },
  {
    id: 14,
    type: "ROYAL MAIL",
    icon: "ti-package",
    message: "Royal Mail: Pay £1.45 redelivery fee at royalmail-redelivery.com/pay",
    answer: "Suspicious",
    flags: ["Tiny-fee bait", "Fake domain", "Authority"],
    rule: "Tiny delivery fees are bait. Use the official app.",
    feedback: "Off-brand domain (the real one is royalmail.com). Tiny fee exploits bounded rationality.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "royalmail-redelivery.com + £1.45",
      attackVector: "Delivery-fee scam (tiny-amount lure)",
      countermeasure: "Track parcels via the official Royal Mail app/site with your tracking number."
    }
  },
  {
    id: 15,
    type: "ACCOUNT ALERT",
    icon: "ti-brand-instagram",
    message: "Instagram: New login from Russia. If this wasn't you, secure your account at instagram-secure-login.tk",
    answer: "Suspicious",
    flags: ["Fear cue", "Suspicious TLD", "Credential theft"],
    rule: "Check login activity from inside the app, not from a link.",
    feedback: "The .tk domain and 'secure-login' pattern are credential-harvest red flags.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "instagram-secure-login.tk",
      attackVector: "Fear-based credential harvest",
      countermeasure: "Open Instagram directly and check Login Activity. Never click links in 'new login' alerts."
    }
  },
  {
    id: 16,
    type: "BEC / CEO FRAUD",
    icon: "ti-school",
    message: "From: Dr Pahee. Quick favour - in a meeting, can you grab £200 Amazon vouchers for me? I'll reimburse Friday.",
    answer: "Suspicious",
    flags: ["Authority", "Urgency", "Voucher scam"],
    rule: "Verify unusual money requests by phone on a known number.",
    feedback: "Classic CEO/authority-fraud script: authority + urgency + unusual gift-card request.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "gift-card favour from 'authority'",
      attackVector: "Business email compromise (BEC) / CEO fraud",
      countermeasure: "Verify any unusual money or voucher request via a known phone number, never by replying to the email."
    }
  },
  {
    id: 17,
    type: "QR CODE",
    icon: "ti-qrcode",
    message: "Royal Mail: Scan this QR to confirm delivery. (sender: noreply@rmail-parcels.info)",
    answer: "Suspicious",
    flags: ["Hidden URL", "Quishing", "Delivery pretext"],
    rule: "Don't scan QR codes in unexpected messages.",
    feedback: "QR codes hide the real URL. 'Quishing' bypasses the visual link check.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "QR code hiding the destination URL",
      attackVector: "Quishing (QR-code phishing)",
      countermeasure: "Never scan QR codes in unexpected messages. Track parcels via the official app instead."
    }
  },
  {
    id: 18,
    type: "DOC SHARE",
    icon: "ti-cloud",
    message: "Anna shared 'Q3-Salary-Spreadsheet.xlsx' with you. View at docs-google-share.net/secure",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Doc-share lure", "Credential theft"],
    rule: "Real Google Drive shares appear inside Drive itself.",
    feedback: "Real Google Drive uses drive.google.com. Off-brand domain + tempting filename = bait.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "docs-google-share.net (not drive.google.com)",
      attackVector: "Document-share credential harvest",
      countermeasure: "Open Google Drive directly. Legitimate shares appear in your Drive without needing a link."
    }
  },
  {
    id: 19,
    type: "WHATSAPP JOB",
    icon: "ti-brand-whatsapp",
    message: "Hi! We have a remote opportunity earning £400/day. Save my number and reply YES to start.",
    answer: "Suspicious",
    flags: ["Unsolicited offer", "Task scam", "Money lure"],
    rule: "Real jobs don't appear from unknown WhatsApp numbers.",
    feedback: "Unsolicited high-pay WhatsApp jobs are scam funnels (often task-scams or pig-butchering).",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "unsolicited £400/day offer via WhatsApp",
      attackVector: "Task-scam / pig-butchering funnel",
      countermeasure: "Block and report. Real jobs come through verified recruiters, not random WhatsApp numbers."
    }
  },
  {
    id: 20,
    type: "DELIVERY",
    icon: "ti-package",
    message: "Royal Mail: Your tracked parcel will be delivered today between 12:30 and 14:30. Track via the Royal Mail app.",
    answer: "Safe",
    flags: ["Info only", "Official app", "No link"],
    rule: "Updates that route to the official app are usually safe.",
    feedback: "Safe. No suspicious link, no fee, just an informational delivery window. Points to the official app.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "informational notice + 'use official app'",
      attackVector: "Safe message (NEAT-compliant)",
      countermeasure: "Use your tracking number in the official app to confirm. No action needed otherwise."
    }
  },
  {
    id: 21,
    type: "BANK ALERT",
    icon: "ti-building-bank",
    message: "ANZ: A contactless payment of £4.20 was approved at COSTA today. To dispute, open your ANZ app.",
    answer: "Safe",
    flags: ["Transaction notice", "Open-app guidance", "No link"],
    rule: "Notifications that say 'open the app' are usually safe.",
    feedback: "Safe. A notification of a real charge that routes you to the app - no link, no urgency to click.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "transaction notification + 'open the app'",
      attackVector: "Safe message",
      countermeasure: "Banks notify and route you to their app. If the charge is unfamiliar, dispute it via the app."
    }
  },
  {
    id: 22,
    type: "CALENDAR",
    icon: "ti-calendar",
    message: "Anthony invited you to 'Group meeting - testing review' on Friday at 14:00 in the library. Accept in your calendar.",
    answer: "Safe",
    flags: ["Known contact", "No credentials", "Plain invite"],
    rule: "Calendar invites from known names are usually safe.",
    feedback: "Safe. A calendar invite from a known contact, no credentials or money requested.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "known-contact calendar invite",
      attackVector: "Safe message",
      countermeasure: "Accept or decline in the calendar app. Message the person directly if details are unclear."
    }
  },
  {
    id: 23,
    type: "2FA CODE",
    icon: "ti-shield-check",
    message: "Microsoft: Your one-time code is 482-901. Use this only if you just signed in. Do not share.",
    answer: "Safe",
    flags: ["Genuine 2FA", "Do-not-share warning", "Context-dependent"],
    rule: "If you just signed in, codes are safe. If not, change your password.",
    feedback: "Safe IF you just signed in. The 'do not share' warning is a hallmark of legitimate 2FA.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "2FA code + 'do not share' warning",
      attackVector: "Safe (genuine 2FA delivery)",
      countermeasure: "If you did NOT just sign in, ignore the code and change your password - someone else is trying."
    }
  },
  {
    id: 24,
    type: "IT NOTICE",
    icon: "ti-mail",
    message: "Hi all - the printers will be offline Thursday morning for upgrades. No action needed. - IT team",
    answer: "Safe",
    flags: ["Info only", "No action", "NEAT-style"],
    rule: "'No action needed' messages don't need action.",
    feedback: "Safe. Informational, no link, no action requested. This is how real IT communicates.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "informational + 'no action needed'",
      attackVector: "Safe (NEAT-style guidance)",
      countermeasure: "No action required. If unsure, walk over to the IT desk and confirm."
    }
  },
  {
    id: 25,
    type: "FRIEND MSG",
    icon: "ti-message-circle",
    message: "Hey - still on for coffee at 3? Let me know if anything changes.",
    answer: "Safe",
    flags: ["Normal chat", "No link", "Routine"],
    rule: "Reflexive 'Suspicious' on chat messages just breaks streaks.",
    feedback: "Safe. A normal social message from a friend. No links, no urgency, no money request.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "normal social message",
      attackVector: "Safe",
      countermeasure: "Reply normally. Routine social messages are not phishing - reflexive 'Suspicious' breaks streaks for nothing."
    }
  },
  {
    id: 26,
    type: "TEAMS FILE",
    icon: "ti-brand-teams",
    message: "John shared 'Q3-budget.xlsx' via Teams. View at teams.microsoft-sharing.net/file/4422",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Doc-share lure", "Credential theft"],
    rule: "Open Teams files from inside Teams, never an external link.",
    feedback: "Looks normal but 'microsoft-sharing.net' is not Microsoft. Real Teams shares open inside Teams, not on a foreign domain.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "teams.microsoft-sharing.net (not microsoft.com)",
      attackVector: "Doc-share credential harvest",
      countermeasure: "Open the Teams desktop or mobile app. Real shares appear there without external links."
    }
  },
  {
    id: 27,
    type: "AULA NOTICE",
    icon: "ti-school",
    message: "Aula: new feedback available on your essay. Log in at aula-cu-london.support.com to view.",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Student-context bait", "Credential theft"],
    rule: "Open your learning portal from a bookmark, never an email link.",
    feedback: "Plausible student message, but the real Aula lives on its own domain - '.support.com' is the giveaway.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "aula-cu-london.support.com",
      attackVector: "Education-pretext credential harvest",
      countermeasure: "Open Aula from your saved bookmark or app. Never authenticate through an email link."
    }
  },
  {
    id: 28,
    type: "MS SESSION",
    icon: "ti-lock-square",
    message: "Microsoft 365: Your session expired. Re-authenticate at login.microsoft365-renew.com to continue.",
    answer: "Suspicious",
    flags: ["Fake domain", "Session-expired bait", "Credential theft"],
    rule: "Microsoft sessions expire silently. They don't email re-login links.",
    feedback: "Real Microsoft uses login.microsoftonline.com - never a third-party 'renew' domain. Session-expiry is a classic phishing pretext.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "login.microsoft365-renew.com",
      attackVector: "Session-expiry pretext",
      countermeasure: "Close the message. Sign in again from the app, not from any link."
    }
  },
  {
    id: 29,
    type: "ONEDRIVE",
    icon: "ti-cloud",
    message: "Marcus shared 'Group presentation v3.pptx' via OneDrive. Open at onedrive-share-cu.net/p/881",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Doc-share lure", "Pretext"],
    rule: "Real OneDrive shares appear in OneDrive itself - no external link needed.",
    feedback: "Looks like a classmate, but 'onedrive-share-cu.net' is not Microsoft. Genuine OneDrive shares route through onedrive.live.com or sharepoint.com.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "onedrive-share-cu.net",
      attackVector: "Trusted-classmate doc-share lure",
      countermeasure: "Open OneDrive directly. If the file is genuine, it will be visible there without any external link."
    }
  },
  {
    id: 30,
    type: "CALENDAR INVITE",
    icon: "ti-calendar-event",
    message: "compliance@training.support invites you to 'Mandatory cyber training'. Join via the attached link.",
    answer: "Suspicious",
    flags: ["Unknown sender", "Mandatory pretext", "Attachment risk"],
    rule: "Compliance training doesn't arrive from unknown senders by surprise invite.",
    feedback: "Calendar invites can carry phishing payloads. The unknown sender + 'mandatory' urgency + attached link is the giveaway.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "compliance@training.support (unknown domain)",
      attackVector: "Calendar-invite phishing payload",
      countermeasure: "Decline. Check Aula or with your real lecturer/IT lead for any genuine training requirement."
    }
  },
  {
    id: 31,
    type: "LECTURER",
    icon: "ti-school",
    message: "Dr Smith: feedback is up on Aula. Open Aula directly via your bookmark - I won't send links.",
    answer: "Safe",
    flags: ["No link", "Official portal", "NEAT-style"],
    rule: "Messages pointing you to the official portal yourself are safe.",
    feedback: "Safe. Explicitly tells you NOT to click and to navigate yourself - a classic NEAT-compliant message.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "'open Aula directly via your bookmark'",
      attackVector: "Safe (NEAT-compliant)",
      countermeasure: "Open Aula yourself. Any message that REFUSES to send a link is acting in your favour."
    }
  },
  {
    id: 32,
    type: "DELIVERY",
    icon: "ti-truck-delivery",
    message: "DPD: Your parcel arrives Wed 9-11am. Track in the DPD app, no action needed otherwise.",
    answer: "Safe",
    flags: ["Official app", "Info only", "No link"],
    rule: "Delivery updates pointing to the carrier's app are usually safe.",
    feedback: "Safe. Time window + 'use the official app' + no link to click = routine delivery notice.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "'track in the DPD app, no action needed'",
      attackVector: "Safe (informational)",
      countermeasure: "Open the DPD app with your tracking number to confirm. No urgent action needed."
    }
  }
];