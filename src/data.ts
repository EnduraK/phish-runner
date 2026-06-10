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

export const LEVELS: LevelConfig[] = [
  { name: "Beginner", icon: "ti-seeding", ms: 9000, lives: 5, mult: 1, blurb: "Slow pace, 5 lives. Great for first-timers.", accent: "safe" },
  { name: "Regular", icon: "ti-walk", ms: 6500, lives: 4, mult: 2, blurb: "Normal speed, 4 lives. 2x points.", accent: "blue" },
  { name: "Expert", icon: "ti-run", ms: 4800, lives: 3, mult: 3, blurb: "Fast pace, 3 lives. 3x points.", accent: "amber" },
  { name: "Cyber Sprint", icon: "ti-bolt", ms: 3400, lives: 3, mult: 5, blurb: "Very fast, 3 lives. 5x points.", accent: "sus" }
];

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    type: "STUDENT FINANCE",
    icon: "ti-school",
    message: "SFE: You're due a £482 grant top-up. Claim by 23:59 today at sfe-student-refund.uk/claim",
    answer: "Suspicious",
    flags: ["Authority", "Urgency", "Fake gov domain"],
    rule: "Real SFE never texts about money. Log in at gov.uk.",
    feedback: "Student Finance never texts about refunds and lives only on gov.uk. Authority + urgency + lookalike domain.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "sfe-student-refund.uk (not gov.uk)",
      attackVector: "Government / authority impersonation",
      countermeasure: "Log into your real SFE account at gov.uk directly. SFE never sends refund links."
    }
  },
  {
    id: 2,
    type: "SPOTIFY",
    icon: "ti-brand-spotify",
    message: "Spotify: payment failed on your Premium Student plan. Update card now at spotify-account-renew.com",
    answer: "Suspicious",
    flags: ["Fake domain", "Subscription bait", "Card theft"],
    rule: "Open Spotify directly. They never push card updates by SMS.",
    feedback: "Real Spotify domain is spotify.com. 'account-renew.com' is a Delivery-step lure for your card.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "spotify-account-renew.com",
      attackVector: "Subscription-renewal pretext",
      countermeasure: "Open the Spotify app. Subscriptions are managed there — never via an SMS link."
    }
  },
  {
    id: 3,
    type: "SNAPCHAT",
    icon: "ti-ghost-2",
    message: "Snapchat: your 412-day streak with Mia expires in 2 hours! Save it at snap-streak-recover.app",
    answer: "Suspicious",
    flags: ["FOMO", "Fake domain", "Urgency"],
    rule: "Snapchat doesn't have a 'recover streak' website. Ever.",
    feedback: "Streaks are a Snap-only feature with no recovery website. Pure FOMO bait targeting Gen Z.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "snap-streak-recover.app",
      attackVector: "FOMO + fear-of-loss credential harvest",
      countermeasure: "Snapchat has no recovery URL for streaks. If it lapses, it lapses — don't hand over your login."
    }
  },
  {
    id: 4,
    type: "MUM (WHATSAPP)",
    icon: "ti-brand-whatsapp",
    message: "Hi love it's mum, new number. My old phone broke — can you send me the 6-digit code I just texted you? Bank locked me out 😩",
    answer: "Suspicious",
    flags: ["Impersonation", "2FA theft", "Emotional pressure"],
    rule: "Never forward a verification code. Not even to family.",
    feedback: "'Hi mum, new number' is the most-reported scam in the UK right now. Code-sharing is 2FA theft.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "'new number' + ask for verification code",
      attackVector: "Family impersonation + 2FA harvest",
      countermeasure: "Call mum on her known number. Never share a verification code with anyone — not even family."
    }
  },
  {
    id: 5,
    type: "REVOLUT",
    icon: "ti-credit-card",
    message: "Revolut: unusual £179 charge in Lithuania. Block the card now at revolut-secure-block.com",
    answer: "Suspicious",
    flags: ["Fear cue", "Fake domain", "Card theft"],
    rule: "Block cards inside the Revolut app — never from a text link.",
    feedback: "Revolut handles everything in-app. A 'block' link in SMS is a fear-cue credential harvest.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "revolut-secure-block.com",
      attackVector: "Fear-based credential harvest",
      countermeasure: "Open the Revolut app and freeze the card there. Real fraud alerts route you to the app, never a link."
    }
  },
  {
    id: 6,
    type: "LECTURER",
    icon: "ti-school",
    message: "Dr Pahee: Week 10 brief is on Aula. Open Aula directly via your bookmark — I never send login links.",
    answer: "Safe",
    flags: ["Official portal", "No link", "NEAT-style"],
    rule: "Messages that tell you NOT to click are usually safe.",
    feedback: "Safe. It defuses social engineering by telling you to navigate yourself — the NEAT pattern.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "'open Aula via your bookmark — no links'",
      attackVector: "Safe message (NEAT-compliant)",
      countermeasure: "When a message refuses to send a link and tells you to navigate yourself, treat that as a green flag."
    }
  },
  {
    id: 7,
    type: "KLARNA",
    icon: "ti-receipt-2",
    message: "Klarna: ASOS order #82201 — final instalment of £14.33 declined. Update card at klarna-instalment-pay.com",
    answer: "Suspicious",
    flags: ["Fake domain", "Tiny-amount bait", "Card theft"],
    rule: "Manage Klarna instalments in the Klarna app only.",
    feedback: "Real Klarna domain is klarna.com. Tiny instalments are the perfect 'I'll just sort it' bait.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "klarna-instalment-pay.com",
      attackVector: "BNPL-payment pretext (card harvest)",
      countermeasure: "Open the Klarna app to handle any instalment. Klarna never collects payment from a third-party domain."
    }
  },
  {
    id: 8,
    type: "DISCORD NITRO",
    icon: "ti-brand-discord",
    message: "Free Discord Nitro from steamcommunity! Claim at discordapp.gift-nitro.ru before it expires.",
    answer: "Suspicious",
    flags: ["Baiting", "Fake domain", "Account takeover"],
    rule: "Real Nitro lives at discord.com — never a .ru or .gift TLD.",
    feedback: "Free-Nitro scams are the #1 way Discord accounts get hijacked. The fake TLD is the giveaway.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "discordapp.gift-nitro.ru",
      attackVector: "Baiting + account takeover",
      countermeasure: "If you want Nitro, buy it inside Discord. Free-Nitro DMs are always credential traps."
    }
  },
  {
    id: 9,
    type: "TINDER",
    icon: "ti-flame",
    message: "Hey! Before we meet I just need you to verify on this safe-dating site: tinder-verified-match.com 💕",
    answer: "Suspicious",
    flags: ["Romance scam", "Verification bait", "Card theft"],
    rule: "Real Tinder doesn't ask you to verify on outside sites.",
    feedback: "'Verification' sites are the #1 dating-app scam. They harvest cards and IDs under a romantic pretext.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "any 'verify on this dating site' link",
      attackVector: "Romance scam + card/ID harvest",
      countermeasure: "Block and unmatch. Real dating apps never push verification through external links."
    }
  },
  {
    id: 10,
    type: "NETFLIX",
    icon: "ti-device-tv",
    message: "Netflix: payment failed. Update your card at netflix.account-pay.com or your subscription ends today.",
    answer: "Suspicious",
    flags: ["Fake domain", "Urgency", "Card theft"],
    rule: "Open Netflix directly. They never push card updates by SMS.",
    feedback: "Real Netflix domain is netflix.com. 'account-pay.com' is a delivery-step lure.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "netflix.account-pay.com",
      attackVector: "Subscription-renewal pretext",
      countermeasure: "Open Netflix directly. Streaming services never push card updates by SMS."
    }
  },
  {
    id: 11,
    type: "CRYPTO DM",
    icon: "ti-currency-bitcoin",
    message: "Bro 🚀 my mate runs the $PEPEAI launch — get in NOW at pepe-ai-presale.io before 10x tomorrow. Last chance.",
    answer: "Suspicious",
    flags: ["FOMO", "Pump-and-dump", "Seed-phrase theft"],
    rule: "Random DMs about crypto = rug pull. Always.",
    feedback: "'My mate runs the launch' is the #1 rug-pull script. Presale sites harvest seed phrases.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "presale URL pushed via DM with urgency",
      attackVector: "Pump-and-dump / seed-phrase harvest",
      countermeasure: "Block. Never connect a wallet to a URL pushed in a DM. Real launches don't need your seed phrase."
    }
  },
  {
    id: 12,
    type: "INVOICE",
    icon: "ti-file",
    message: "Invoice #4423 attached. Open invoice.pdf.exe to view your payment details.",
    answer: "Suspicious",
    flags: ["Double extension", "Malware", "Attachment risk"],
    rule: "Real PDFs end in .pdf — not .pdf.exe.",
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
    type: "APPLE ID",
    icon: "ti-brand-apple",
    message: "Apple: your iCloud will be deleted in 24h. Confirm now at appleid-secure-login.com",
    answer: "Suspicious",
    flags: ["Authority", "Fake domain", "Credential theft"],
    rule: "Apple never threatens deletion. Manage iCloud in Settings only.",
    feedback: "Real Apple domain is apple.com. 'appleid-secure-login.com' is the most-cloned Apple phish on record.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "appleid-secure-login.com",
      attackVector: "Apple ID credential harvest",
      countermeasure: "Manage Apple ID in Settings on your device. Apple never sends 'delete in 24h' threats."
    }
  },
  {
    id: 14,
    type: "DELIVEROO",
    icon: "ti-bike",
    message: "Deliveroo: £20 free credit just for you 🎉 Claim at deliveroo-promo-credit.com before midnight.",
    answer: "Suspicious",
    flags: ["Baiting", "Fake domain", "Card theft"],
    rule: "Real promos appear inside the app, not via SMS links.",
    feedback: "Free credit promos always live inside the Deliveroo app. A third-party 'promo' URL is bait.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "deliveroo-promo-credit.com",
      attackVector: "Baiting / card-update lure",
      countermeasure: "Open the Deliveroo app. Real promos show up in the Offers tab without any external link."
    }
  },
  {
    id: 15,
    type: "INSTAGRAM",
    icon: "ti-brand-instagram",
    message: "Instagram: new login from Lagos, Nigeria. If this wasn't you, secure your account at instagram-secure-login.tk",
    answer: "Suspicious",
    flags: ["Fear cue", "Suspicious TLD", "Credential theft"],
    rule: "Check Login Activity inside the app — never from a link.",
    feedback: "The .tk TLD and 'secure-login' pattern are credential-harvest red flags.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "instagram-secure-login.tk",
      attackVector: "Fear-based credential harvest",
      countermeasure: "Open Instagram → Settings → Login Activity. Never click links in 'new login' alerts."
    }
  },
  {
    id: 16,
    type: "LECTURER (BEC)",
    icon: "ti-school",
    message: "From: Dr Pahee. Stuck in a meeting — could you grab £200 Amazon vouchers for staff prizes? I'll Venmo you Friday.",
    answer: "Suspicious",
    flags: ["Authority", "Urgency", "Voucher scam"],
    rule: "Verify unusual money requests by calling on a known number.",
    feedback: "Classic CEO/authority-fraud script: authority + urgency + voucher request. Lecturers never do this.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "voucher favour from 'authority'",
      attackVector: "Business email compromise (BEC)",
      countermeasure: "Call Dr Pahee on a number you already have. Never act on a voucher request from email alone."
    }
  },
  {
    id: 17,
    type: "QR PARKING",
    icon: "ti-qrcode",
    message: "Coventry city parking: scan QR to extend stay or pay £40 fine. (sticker on meter)",
    answer: "Suspicious",
    flags: ["Hidden URL", "Quishing", "Card theft"],
    rule: "Don't scan random QR codes — use the official parking app.",
    feedback: "Quishing on parking meters is exploding in UK cities. QR codes hide the destination URL.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "QR sticker on a public meter",
      attackVector: "Quishing (QR-code phishing)",
      countermeasure: "Pay through the official RingGo / PayByPhone app, not a QR on a meter."
    }
  },
  {
    id: 18,
    type: "GOOGLE DOC",
    icon: "ti-cloud",
    message: "Anna shared 'Q3-Salary-Spreadsheet.xlsx' with you. Open at docs-google-share.net/secure",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Curiosity bait", "Credential theft"],
    rule: "Real Drive shares appear in Drive itself — no link needed.",
    feedback: "Real Drive uses drive.google.com. Off-brand domain + nosy filename = bait.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "docs-google-share.net (not drive.google.com)",
      attackVector: "Curiosity-based credential harvest",
      countermeasure: "Open Google Drive directly. Real shares appear in your Drive without any external link."
    }
  },
  {
    id: 19,
    type: "WHATSAPP JOB",
    icon: "ti-brand-whatsapp",
    message: "Hi! We have a remote part-time role earning £400/day, just reviewing Amazon products. Save my number and reply YES.",
    answer: "Suspicious",
    flags: ["Unsolicited offer", "Task scam", "Money lure"],
    rule: "Real jobs don't arrive from unknown WhatsApp numbers.",
    feedback: "Unsolicited high-pay WhatsApp jobs are task-scam funnels — they ask for a small deposit, then vanish.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "unsolicited £400/day offer via WhatsApp",
      attackVector: "Task-scam / pig-butchering funnel",
      countermeasure: "Block and report. Real jobs come through verified recruiters, never random WhatsApp numbers."
    }
  },
  {
    id: 20,
    type: "ROYAL MAIL",
    icon: "ti-package",
    message: "Royal Mail: Your tracked parcel arrives today between 12:30 and 14:30. Track via the Royal Mail app.",
    answer: "Safe",
    flags: ["Info only", "Official app", "No link"],
    rule: "Updates that route to the official app are usually safe.",
    feedback: "Safe. No link, no fee, just a delivery window pointing to the official app.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "informational notice + 'use official app'",
      attackVector: "Safe message (NEAT-compliant)",
      countermeasure: "Use your tracking number in the Royal Mail app. No action needed otherwise."
    }
  },
  {
    id: 21,
    type: "MONZO",
    icon: "ti-credit-card",
    message: "Monzo: £4.20 spent at COSTA today. Not you? Freeze the card in the Monzo app.",
    answer: "Safe",
    flags: ["Transaction notice", "Open-app guidance", "No link"],
    rule: "Bank notifications that say 'open the app' are usually safe.",
    feedback: "Safe. Transaction notice that routes you to the app — no link, no urgency to click.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "transaction notification + 'open the app'",
      attackVector: "Safe message",
      countermeasure: "Banks notify and route to the app. Freeze the card from there if you didn't make the purchase."
    }
  },
  {
    id: 22,
    type: "CALENDAR",
    icon: "ti-calendar",
    message: "Anthony invited you to 'Group meeting — testing review' Friday 14:00, JL204. Accept in your calendar.",
    answer: "Safe",
    flags: ["Known contact", "No credentials", "Plain invite"],
    rule: "Calendar invites from teammates are usually safe.",
    feedback: "Safe. Known teammate, normal meeting, no credentials or money request.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "known-contact calendar invite",
      attackVector: "Safe message",
      countermeasure: "Accept or decline in the calendar app. Message Anthony directly if details are unclear."
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
      countermeasure: "If you did NOT just sign in, ignore the code and change your password — someone else is trying."
    }
  },
  {
    id: 24,
    type: "IT NOTICE",
    icon: "ti-mail",
    message: "Hi all — the campus printers will be offline Thursday morning for upgrades. No action needed. — IT team",
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
    type: "FRIEND TEXT",
    icon: "ti-message-circle",
    message: "yo still on for coffee at 3? library lobby?",
    answer: "Safe",
    flags: ["Normal chat", "No link", "Routine"],
    rule: "Reflexive 'Suspicious' on chat messages just breaks streaks.",
    feedback: "Safe. Normal social message — no links, no urgency, no money request.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "normal social message",
      attackVector: "Safe",
      countermeasure: "Reply normally. Routine chat is not phishing — guessing 'Suspicious' breaks streaks for nothing."
    }
  },
  {
    id: 26,
    type: "TEAMS FILE",
    icon: "ti-brand-teams",
    message: "John shared 'Q3-budget.xlsx' via Teams. View at teams.microsoft-sharing.net/file/4422",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Doc-share lure", "Credential theft"],
    rule: "Open Teams files inside Teams, never an external link.",
    feedback: "Looks normal but 'microsoft-sharing.net' is not Microsoft. Real Teams shares open inside Teams.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "teams.microsoft-sharing.net",
      attackVector: "Doc-share credential harvest",
      countermeasure: "Open the Teams desktop or mobile app. Real shares appear there without external links."
    }
  },
  {
    id: 27,
    type: "AULA",
    icon: "ti-school",
    message: "Aula: new essay feedback from Dr Smith. Log in at aula-cu-london.support.com to view.",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Student-context bait", "Credential theft"],
    rule: "Open Aula from your bookmark, never an email link.",
    feedback: "Plausible student message, but the real Aula lives on its own domain — '.support.com' is the giveaway.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "aula-cu-london.support.com",
      attackVector: "Education-pretext credential harvest",
      countermeasure: "Open Aula from your saved bookmark or app. Never authenticate through an email link."
    }
  },
  {
    id: 28,
    type: "AI VOICE CALL",
    icon: "ti-microphone",
    message: "Voicemail from 'Dad' (synthesized): 'Hi sweetheart, lost my wallet — can you transfer £300 to 04-1928-7711? Urgent.'",
    answer: "Suspicious",
    flags: ["Deepfake voice", "Emotional pressure", "Money transfer"],
    rule: "AI-cloned voices are real. Always call back on a known number.",
    feedback: "AI voice-clone scams are now mainstream. Even a recognisable voice should never trigger a transfer.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "urgent money transfer request via voicemail",
      attackVector: "AI voice-clone (deepfake) social engineering",
      countermeasure: "Hang up. Call the person on their known number to verify before sending any money."
    }
  },
  {
    id: 29,
    type: "ONEDRIVE",
    icon: "ti-cloud",
    message: "Marcus shared 'Group presentation v3.pptx' via OneDrive. Open at onedrive-share-cu.net/p/881",
    answer: "Suspicious",
    flags: ["Lookalike domain", "Doc-share lure", "Pretext"],
    rule: "OneDrive shares appear in OneDrive — no external link needed.",
    feedback: "Looks like a classmate, but 'onedrive-share-cu.net' is not Microsoft.",
    cybok: "Privacy & Online Rights KA",
    breakdown: {
      targetCue: "onedrive-share-cu.net",
      attackVector: "Trusted-classmate doc-share lure",
      countermeasure: "Open OneDrive directly. Genuine shares appear there without any external link."
    }
  },
  {
    id: 30,
    type: "AMAZON",
    icon: "ti-shopping-cart",
    message: "Amazon: your order #112-4928 has been delivered. Track in the Amazon app.",
    answer: "Safe",
    flags: ["Info only", "Official app", "No link"],
    rule: "Order updates routing to the official app are usually safe.",
    feedback: "Safe. No link, no fee — a routine delivery confirmation pointing to the app.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "delivery confirmation + 'track in app'",
      attackVector: "Safe (informational)",
      countermeasure: "Open the Amazon app to confirm. No urgent action needed."
    }
  },
  {
    id: 31,
    type: "BOOKING RECRUITER",
    icon: "ti-briefcase",
    message: "LinkedIn: £85k remote SOC analyst role — reply with your CV + scanned passport to verify@global-talent-hire.co",
    answer: "Suspicious",
    flags: ["ID document", "Pretexting", "Identity theft"],
    rule: "No real recruiter asks for ID before an interview.",
    feedback: "Real recruiters never request scanned ID up front. CV + passport = identity-theft kit.",
    cybok: "Adversarial Behaviours KA",
    breakdown: {
      targetCue: "ID-document request before any interview",
      attackVector: "Recruitment pretext / identity theft",
      countermeasure: "Verify recruiters on LinkedIn directly. Never send ID until a verified offer is in place."
    }
  },
  {
    id: 32,
    type: "BANK (FRIEND)",
    icon: "ti-building-bank",
    message: "Aisha just sent you £40 via your bank's pay-by-name. Check the activity in your banking app.",
    answer: "Safe",
    flags: ["Known contact", "Open-app guidance", "No link"],
    rule: "Real payment alerts route to your banking app, never a link.",
    feedback: "Safe. Named contact, in-app verification, no link to click. This is how legit transfers feel.",
    cybok: "Human Factors KA",
    breakdown: {
      targetCue: "transfer notification + 'check the app'",
      attackVector: "Safe message",
      countermeasure: "Open your banking app to confirm the £40 landed. Routine social transfers don't need links."
    }
  }
];

