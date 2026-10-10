// Seeds realistic sample vendors so the directory can be clicked through.
// Every vendor, phone number and review here is made up.
import { Pool } from "pg";
import { randomBytes } from "node:crypto";
import { TEMPLATES } from "../lib/templates";
import { SUBCITIES, type CategoryKey } from "../lib/catalog";
import { addDays, todayAddis } from "../lib/ethiopian";

let seed = 20261010;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const pickN = <T,>(a: readonly T[], n: number) => [...a].sort(() => rnd() - 0.5).slice(0, n);
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));

type V = {
  name: string; am: string; cat: CategoryKey; bio: string; bioAm: string;
  pkgs: [string, string, number, number | null, string][]; // name, name_am, price, hours, inclusions
  text?: Record<string, [string, string]>; tags?: Record<string, string[]>;
  status?: "pending" | "rejected"; verified?: boolean; plan?: "pro" | "featured" | "founding";
};

const VENDORS: V[] = [
  // Photographers
  { name: "Lucy Lens Studio", am: "ሉሲ ሌንስ ስቱዲዮ", cat: "photographer", verified: true, plan: "featured",
    bio: "Wedding and engagement photography since 2016. Natural light, real moments, and albums printed in Addis.", bioAm: "ከ2008 ዓ.ም. ጀምሮ የሰርግና የቀለበት ፎቶግራፍ። ተፈጥሯዊ ብርሃን፣ እውነተኛ ቅጽበቶች።",
    pkgs: [["Silver", "ሲልቨር", 18000, 6, "250 edited photos\nOnline gallery\nDelivery in 3 weeks"], ["Gold", "ጎልድ", 32000, 10, "500 edited photos\n30x30 album\nSecond shooter\nDelivery in 3 weeks"], ["Platinum", "ፕላቲኒየም", 48000, 12, "Full day, 2 shooters\n2 albums\nPre-wedding shoot"]],
    text: { equipment: ["Canon R5 and R6, prime lenses, off-camera flash", "ካኖን R5 እና R6"], second_shooter: ["Included on Gold and Platinum", "በጎልድና ፕላቲኒየም ይካተታል"] } },
  { name: "Abel Tesfaye Photography", am: "አቤል ተስፋዬ ፎቶግራፊ", cat: "photographer", verified: true, plan: "pro",
    bio: "Documentary-style photographer for weddings, melse and graduations. Fast delivery: preview photos in 48 hours.", bioAm: "ለሰርግ፣ መልስና ምረቃ ፎቶግራፈር። ቅድመ እይታ በ48 ሰዓት።",
    pkgs: [["Half day", "ግማሽ ቀን", 12000, 4, "150 edited photos\nOnline gallery"], ["Full day", "ሙሉ ቀን", 22000, 9, "350 edited photos\n20x30 album"]],
    text: { equipment: ["Sony A7 IV, 24-70mm, 85mm", "ሶኒ A7 IV"] } },
  { name: "Selam Frames", am: "ሰላም ፍሬምስ", cat: "photographer", verified: false,
    bio: "Birthday, baptism and family portraits. Studio in Kazanchis with traditional dress available.", bioAm: "የልደት፣ ክርስትናና የቤተሰብ ፎቶዎች። ስቱዲዮ ካዛንቺስ።",
    pkgs: [["Studio session", "የስቱዲዮ ቀጠሮ", 3500, 1, "20 edited photos\n2 outfits"], ["Event coverage", "የዝግጅት ሽፋን", 9000, 4, "120 edited photos"]] },
  { name: "Habesha Moments", am: "ሀበሻ ሞመንትስ", cat: "photographer", verified: true,
    bio: "Traditional and modern weddings across Addis and nearby towns. We know the ceremonies and never miss the key moments.", bioAm: "ባህላዊና ዘመናዊ ሰርጎች በአዲስ አበባና አካባቢው።",
    pkgs: [["Wedding classic", "ክላሲክ", 25000, 8, "400 edited photos\nAlbum"], ["Wedding + melse", "ሰርግ + መልስ", 38000, 14, "Two days\n600 edited photos\n2 albums"]] },
  { name: "Kidus Photo Works", am: "ቅዱስ ፎቶ ወርክስ", cat: "photographer", status: "pending",
    bio: "New studio in Ayat. Graduation and engagement shoots.", bioAm: "በአያት አዲስ ስቱዲዮ።",
    pkgs: [["Graduation", "ምረቃ", 4000, 2, "40 edited photos"]] },

  // Videographers
  { name: "Entoto Films", am: "እንጦጦ ፊልምስ", cat: "videographer", verified: true, plan: "featured",
    bio: "Cinematic wedding films with drone. Highlight film ready for your reception screen the same night.", bioAm: "ሲኒማቲክ የሰርግ ፊልሞች ከድሮን ጋር።",
    pkgs: [["Highlight", "ሃይላይት", 20000, 8, "3-minute highlight\n1 camera"], ["Cinematic", "ሲኒማቲክ", 45000, 12, "2 cameras + drone\n5-min highlight\n60-min film\nSame-day edit"]],
    text: { drone: ["Yes, DJI Mavic 3 on outdoor shoots", "አዎ"] } },
  { name: "Meron Visuals", am: "ሜሮን ቪዥዋልስ", cat: "videographer", verified: true, plan: "pro",
    bio: "Wedding and corporate video. Clean edits, licensed music, delivered on USB and online.", bioAm: "የሰርግና የድርጅት ቪዲዮ።",
    pkgs: [["Standard", "መደበኛ", 15000, 6, "Full film 45 min\nHighlight 2 min"], ["Premium", "ፕሪሚየም", 28000, 10, "2 cameras\nDrone\nFull film + highlight"]] },
  { name: "Nahom Video Production", am: "ናሆም ቪዲዮ ፕሮዳክሽን", cat: "videographer",
    bio: "Affordable event video for birthdays, graduations and baptisms.", bioAm: "ተመጣጣኝ የዝግጅት ቪዲዮ።",
    pkgs: [["Event", "ዝግጅት", 7000, 4, "Edited 20-minute video"]] },
  { name: "Addis Drone Crew", am: "አዲስ ድሮን ክሩ", cat: "videographer", verified: false,
    bio: "Aerial video for weddings, outdoor events and venues.", bioAm: "ለሰርግና ከቤት ውጭ ዝግጅቶች የአየር ላይ ቀረጻ።",
    pkgs: [["Drone add-on", "ድሮን", 8000, 3, "Aerial shots edited into your film"]], text: { drone: ["Drone is our specialty", "ድሮን ልዩ ሙያችን ነው"] } },

  // Makeup
  { name: "Glam by Hana", am: "ግላም በሀና", cat: "makeup", verified: true, plan: "featured",
    bio: "Bridal makeup artist for 8 years. Soft glam and traditional looks that last through the dancing.", bioAm: "ለ8 ዓመታት የሙሽሪት ሜካፕ።",
    pkgs: [["Bride", "ሙሽሪት", 8000, null, "Trial session\nLashes\nTouch-up kit"], ["Bride + 4 bridesmaids", "ሙሽሪት + 4 ሚዜዎች", 18000, null, "Home visit included"], ["Party look", "የፓርቲ", 2500, null, "Soft glam"]],
    tags: { looks: ["bridal", "traditional", "soft_glam", "party"] }, text: { products: ["MAC, Huda Beauty, Fenty, Charlotte Tilbury", ""], travel: ["Yes, anywhere in Addis", "አዎ፣ በአዲስ አበባ ውስጥ"] } },
  { name: "Bethlehem Beauty", am: "ቤተልሔም ቢውቲ", cat: "makeup", verified: true, plan: "founding",
    bio: "Makeup and hair for brides and families. Salon in Bole Medhanialem or at your home.", bioAm: "ሜካፕና ጸጉር ለሙሽሮችና ቤተሰብ።",
    pkgs: [["Bridal", "የሙሽሪት", 6500, null, "Makeup + hair"], ["Guest", "እንግዳ", 1800, null, "Makeup"]],
    tags: { looks: ["bridal", "traditional", "party"] } },
  { name: "Tsion Makeup Artistry", am: "ጽዮን ሜካፕ", cat: "makeup",
    bio: "Graduation and party makeup at student-friendly prices.", bioAm: "የምረቃና የፓርቲ ሜካፕ።",
    pkgs: [["Graduation", "ምረቃ", 1500, null, "Makeup + lashes"]], tags: { looks: ["soft_glam", "party"] } },
  { name: "Rahel Bridal Studio", am: "ራሄል የሙሽሪት ስቱዲዮ", cat: "makeup", verified: true,
    bio: "Bridal packages including kemis styling and traditional hair braiding.", bioAm: "የሙሽሪት ፓኬጆች ከቀሚስና ሹሩባ ጋር።",
    pkgs: [["Traditional bride", "ባህላዊ ሙሽሪት", 9000, null, "Makeup\nShuruba braiding\nKemis styling"]], tags: { looks: ["bridal", "traditional"] } },

  // Decorators
  { name: "Gold Touch Decor", am: "ጎልድ ታች ዲኮር", cat: "decorator", verified: true, plan: "featured",
    bio: "Wedding hall and outdoor decor. Fresh flowers, lighting and stage backdrops for 100 to 1,000 guests.", bioAm: "የሰርግ አዳራሽና የውጭ ዲኮር።",
    pkgs: [["100 guests", "100 እንግዶች", 35000, null, "Stage backdrop\nTable flowers\nLighting"], ["300 guests", "300 እንግዶች", 85000, null, "Stage, aisle, entrance\nChair covers\nFairy lights"], ["500+ guests", "500+ እንግዶች", 150000, null, "Full venue design"]],
    tags: { themes: ["traditional", "modern", "outdoor", "tent"] }, text: { items: ["Fresh roses, LED lighting, backdrops, chair covers, tents", ""] } },
  { name: "Bole Blooms Events", am: "ቦሌ ብሉምስ", cat: "decorator", verified: true, plan: "pro",
    bio: "Modern floral design for weddings, engagements and corporate dinners.", bioAm: "ዘመናዊ የአበባ ዲዛይን።",
    pkgs: [["Engagement", "ቀለበት", 18000, null, "Backdrop\nTable centerpieces"], ["Wedding 200", "ሰርግ 200", 60000, null, "Full hall"]], tags: { themes: ["modern", "outdoor"] } },
  { name: "Merkato Party Rentals & Decor", am: "መርካቶ ፓርቲ ዲኮር", cat: "decorator",
    bio: "Chairs, tents, lights and simple decor at good prices.", bioAm: "ወንበር፣ ድንኳን፣ መብራትና ዲኮር።",
    pkgs: [["Tent package", "ድንኳን", 15000, null, "Tent for 150\nChairs\nLights"]], tags: { themes: ["tent", "traditional"] } },
  { name: "Ethio Elegance Decor", am: "ኢትዮ ኤሌጋንስ ዲኮር", cat: "decorator", status: "pending",
    bio: "Traditional Ethiopian decor with mesob, baskets and habesha fabrics.", bioAm: "ባህላዊ ዲኮር በመሶብና በሀበሻ ጨርቅ።",
    pkgs: [["Traditional", "ባህላዊ", 30000, null, "Mesob centerpieces\nHabesha fabric backdrop"]], tags: { themes: ["traditional"] } },

  // Planners
  { name: "Yene Events", am: "የኔ ኢቨንትስ", cat: "planner", verified: true, plan: "featured",
    bio: "Full wedding planning for local and diaspora families. We handle vendors, budget and the day itself.", bioAm: "ለሀገር ውስጥና ለዳያስፖራ ቤተሰቦች ሙሉ የሰርግ እቅድ።",
    pkgs: [["Day-of coordination", "የዕለቱ ማስተባበር", 25000, 12, "Timeline\nVendor coordination\n2 coordinators"], ["Full planning", "ሙሉ እቅድ", 90000, null, "6 months planning\nBudget\nAll vendors"]],
    tags: { services: ["full", "day_of", "budget", "diaspora"] }, text: { story: ["A 600-guest wedding for a family in Washington DC: we planned everything over video calls, booked 9 vendors and ran both the wedding and melse.", ""], partners: ["Entoto Films, Glam by Hana, Gold Touch Decor", ""] } },
  { name: "Saba Planning Co.", am: "ሳባ ፕላኒንግ", cat: "planner", verified: true,
    bio: "Birthdays, graduations and corporate events, planned end to end.", bioAm: "ልደት፣ ምረቃና የድርጅት ዝግጅቶች።",
    pkgs: [["Party planning", "የፓርቲ እቅድ", 15000, null, "Venue\nDecor\nCatering coordination"]], tags: { services: ["full", "budget"] } },
  { name: "Kal Event Management", am: "ቃል ኢቨንት ማኔጅመንት", cat: "planner",
    bio: "Corporate launches and conferences.", bioAm: "የድርጅት ዝግጅቶች።",
    pkgs: [["Conference", "ኮንፈረንስ", 40000, null, "Full coordination"]], tags: { services: ["full", "day_of"] } },

  // DJs
  { name: "DJ Kush", am: "ዲጄ ኩሽ", cat: "dj", verified: true, plan: "featured",
    bio: "Wedding DJ who reads the room: Ethiopian classics, Afrobeat and the latest hits. Own sound and lights.", bioAm: "የሰርግ ዲጄ፡ ኢትዮጵያዊ፣ አፍሮቢትና አዳዲስ ዘፈኖች።",
    pkgs: [["4 hours", "4 ሰዓት", 15000, 4, "Sound for 300\nBasic lights"], ["Full night", "ሙሉ ሌሊት", 28000, 8, "Sound for 600\nMoving heads\nFog\nMC"]],
    tags: { styles: ["ethiopian", "afrobeat", "international", "oldies"] }, text: { equipment: ["Yes: JBL PA for 600, 4 moving heads, fog machine, wireless mics", ""] } },
  { name: "DJ Mimi", am: "ዲጄ ሚሚ", cat: "dj", verified: true, plan: "pro",
    bio: "Birthdays, engagements and corporate parties. Clean sets for family events.", bioAm: "ልደት፣ ቀለበትና የድርጅት ፓርቲዎች።",
    pkgs: [["Party", "ፓርቲ", 9000, 4, "Sound for 150"], ["Wedding", "ሰርግ", 20000, 7, "Sound for 400\nLights"]], tags: { styles: ["ethiopian", "afrobeat", "international"] } },
  { name: "DJ Abiy Gospel Sounds", am: "ዲጄ አብይ", cat: "dj",
    bio: "Gospel and clean Ethiopian music for church weddings and baptisms.", bioAm: "መንፈሳዊ ሙዚቃ ለሰርግና ክርስትና።",
    pkgs: [["Event", "ዝግጅት", 8000, 5, "Sound for 250"]], tags: { styles: ["gospel", "ethiopian"] } },
  { name: "DJ Rophnan Jr", am: "ዲጄ ሮፍናን ጁኒየር", cat: "dj", status: "rejected",
    bio: "Club DJ.", bioAm: "",
    pkgs: [["Night", "ሌሊት", 12000, 6, ""]], tags: { styles: ["international"] } },

  // Singers
  { name: "Mahlet Wedding Songs", am: "ማህሌት የሰርግ ዘፈኖች", cat: "singer", verified: true, plan: "pro",
    bio: "Traditional wedding songs for the bride's entrance and the ceremony, in Amharic and Afaan Oromo.", bioAm: "ለሙሽሪት መግቢያና ለስነ ስርዓቱ ባህላዊ የሰርግ ዘፈኖች።",
    pkgs: [["Entrance", "መግቢያ", 10000, 1, "3 songs\nWith keyboard"], ["Ceremony + reception", "ስነ ስርዓት + ግብዣ", 25000, 3, "10 songs\nWith 3-piece band"]],
    tags: { song_types: ["traditional", "wedding"] }, text: { languages: ["Amharic, Afaan Oromo", "አማርኛ፣ ኦሮምኛ"] } },
  { name: "Yared Voice", am: "ያሬድ ቮይስ", cat: "singer", verified: true,
    bio: "Gospel and modern Ethiopian songs for weddings and church events.", bioAm: "መንፈሳዊና ዘመናዊ ዘፈኖች።",
    pkgs: [["Solo", "ብቻ", 8000, 1, "5 songs with backing tracks"]], tags: { song_types: ["gospel", "modern"] }, text: { languages: ["Amharic, English", "አማርኛ፣ እንግሊዝኛ"] } },
  { name: "Selamawit Tigrinya Songs", am: "ሰላማዊት", cat: "singer",
    bio: "Tigrinya and Amharic wedding songs.", bioAm: "የትግርኛና የአማርኛ የሰርግ ዘፈኖች።",
    pkgs: [["Wedding set", "የሰርግ", 12000, 2, "8 songs"]], tags: { song_types: ["traditional", "wedding"] }, text: { languages: ["Tigrinya, Amharic", "ትግርኛ፣ አማርኛ"] } },

  // Bands
  { name: "Afro-Addis Band", am: "አፍሮ-አዲስ ባንድ", cat: "band", verified: true, plan: "featured",
    bio: "Seven-piece band playing Ethio-jazz, classics and today's hits. Full PA included.", bioAm: "ሰባት አባላት ያሉት ባንድ፡ ኢትዮ-ጃዝና ተወዳጅ ዘፈኖች።",
    pkgs: [["2 sets", "2 ስብስብ", 45000, 3, "2 x 60-minute sets\nFull PA"], ["Full night", "ሙሉ ሌሊት", 80000, 6, "4 sets\nFull PA and lights"]],
    tags: { genres: ["ethio_jazz", "traditional", "pop"] }, text: { members: ["2 vocals, keyboard, bass, drums, saxophone, krar", ""], equipment: ["We bring a full PA. We need a 4x3 m stage and two power points.", ""] } },
  { name: "Zion Gospel Band", am: "ጽዮን መንፈሳዊ ባንድ", cat: "band", verified: true,
    bio: "Gospel band for church weddings, baptisms and conferences.", bioAm: "መንፈሳዊ ባንድ።",
    pkgs: [["Service", "አገልግሎት", 20000, 2, "1 set\nSound included"]], tags: { genres: ["gospel"] } },
  { name: "Jano Covers", am: "ጃኖ ከቨርስ", cat: "band",
    bio: "Pop and Ethiopian covers for receptions and corporate parties.", bioAm: "ፖፕና የኢትዮጵያ ዘፈኖች።",
    pkgs: [["Reception", "ግብዣ", 30000, 3, "2 sets"]], tags: { genres: ["pop", "reggae"] } },

  // Bakers
  { name: "Sweet Tooth Cakes", am: "ስዊት ቱዝ ኬክ", cat: "baker", verified: true, plan: "pro",
    bio: "Tiered wedding cakes and dessert tables. Free tasting for wedding orders.", bioAm: "ባለ ደረጃ የሰርግ ኬኮች።",
    pkgs: [["3-tier, 150 servings", "3 ደረጃ፣ 150 ሰው", 14000, null, "Fondant or buttercream\nDelivery and setup"], ["5-tier, 300 servings", "5 ደረጃ፣ 300 ሰው", 28000, null, "Delivery and setup"], ["Birthday cake", "የልደት ኬክ", 1800, null, "20 servings"]],
    text: { flavours: ["Vanilla, chocolate, red velvet, coffee, mango", ""], delivery: ["Free delivery and setup in Bole and Kirkos", ""], lead_time: ["Wedding cakes: 14 days. Birthday cakes: 3 days.", "የሰርግ ኬክ፡ 14 ቀን"] } },
  { name: "Enat Dabo Bakery", am: "እናት ዳቦ", cat: "baker", verified: true,
    bio: "Traditional breads (ambasha, dabo) and cakes for melse, baptisms and holidays.", bioAm: "ባህላዊ ዳቦ (አምባሻ፣ ዳቦ) እና ኬኮች።",
    pkgs: [["Ambasha for 100", "አምባሻ ለ100", 4500, null, "Decorated ambasha"], ["Celebration cake", "ኬክ", 2500, null, "30 servings"]],
    text: { lead_time: ["5 days", "5 ቀን"] } },
  { name: "Cupcake Corner Addis", am: "ካፕኬክ ኮርነር", cat: "baker",
    bio: "Cupcakes and small cakes for birthdays and office parties.", bioAm: "ካፕኬክና ትናንሽ ኬኮች።",
    pkgs: [["50 cupcakes", "50 ካፕኬክ", 3000, null, "Custom toppers"]] },

  // Painters
  { name: "Live Brush by Dawit", am: "ላይቭ ብሩሽ በዳዊት", cat: "painter", verified: true, plan: "pro",
    bio: "I paint your wedding live, on canvas, while your guests watch. Finished at the end of the night.", bioAm: "ሰርግዎን በቀጥታ በሸራ ላይ እስላለሁ።",
    pkgs: [["Live painting 60x90", "ቀጥታ 60x90", 22000, 4, "Canvas, frame"], ["Portrait from photo", "ከፎቶ ፖርትሬት", 7000, null, "40x50 cm"]],
    text: { sizes: ["40x50 cm to 120x90 cm", ""], time: ["Live: 3–4 hours during the event. Portraits: 1 week.", ""] } },
  { name: "Mural Art Addis", am: "ሙራል አርት አዲስ", cat: "painter",
    bio: "Murals and decor painting for venues, cafés and event backdrops.", bioAm: "የግድግዳ ስዕል ለአዳራሾችና ካፌዎች።",
    pkgs: [["Backdrop panel", "የዳራ ስዕል", 15000, null, "2x3 m painted backdrop"]], text: { sizes: ["Panels up to 3x4 m", ""] } },
  { name: "Liya Portraits", am: "ሊያ ፖርትሬትስ", cat: "painter", status: "pending",
    bio: "Pencil and oil portraits as wedding gifts.", bioAm: "እንደ ስጦታ ፖርትሬቶች።",
    pkgs: [["Pencil A3", "እርሳስ A3", 3000, null, ""]] },
];

const REVIEWERS = ["Meseret A.", "Dawit K.", "Hiwot T.", "Yonas G.", "Bezawit M.", "Samuel B.", "Tigist H.", "Robel F.", "Feven W.", "Biniam S.", "Eden Y.", "Natnael D."];
const GOOD = [
  "Arrived early and stayed until the end. The photos came back faster than promised.",
  "Very professional and easy to talk to on Telegram. Our families loved it.",
  "Exactly what we asked for. Worth every birr.",
  "ሁሉም ሰው አድንቋል። በጣም እናመሰግናለን!",
  "Great quality and fair price. We would book again.",
  "They understood our traditional ceremony and didn't miss anything.",
];
const MEH = ["Good work but they were an hour late.", "Nice result, but communication before the day was slow."];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query("TRUNCATE vendors, packages, portfolio_items, availability, contact_events, vendor_daily_stats, reviews, subscriptions, sponsored_slots RESTART IDENTITY CASCADE");
  const today = todayAddis();
  const month = today.slice(0, 8) + "01";

  for (const [i, v] of VENDORS.entries()) {
    const tpl = TEMPLATES[v.cat];
    const subcities = pickN(SUBCITIES.map((s) => s.key), int(2, 5));
    if (v.plan === "featured" && !subcities.includes("bole")) subcities[0] = "bole";
    const sections: Record<string, unknown> = {};
    for (const [k, [en, am]] of Object.entries(v.text ?? {})) sections[k] = { en, am };
    for (const [k, tags] of Object.entries(v.tags ?? {})) sections[k] = { tags };
    const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const phone = `+2519${String(10000000 + i * 1234567).slice(0, 8)}`;
    const look = v.plan === "featured" ? pick(["gold", "night", "modern"]) : pick(["classic", "modern", "bold"]);
    const r = await pool.query(
      `INSERT INTO vendors (slug, name, name_am, category, subcities, look, bio, bio_am, sections, phone, telegram, whatsapp, starting_price, status, verified, verified_at, manage_token, created_at, admin_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, now() - ($18 || ' days')::interval, $19) RETURNING id`,
      [slug, v.name, v.am, v.cat, subcities, look, v.bio, v.bioAm, JSON.stringify(sections), phone,
        rnd() > 0.2 ? slug.replace(/-/g, "_").slice(0, 24) : null, rnd() > 0.4 ? phone : null,
        Math.min(...v.pkgs.map((p) => p[2])), v.status ?? "approved", !!v.verified, v.verified ? new Date(Date.now() - int(1, 60) * 86400000) : null,
        `demo-${slug}`, String(v.status === "pending" ? int(0, 2) : int(20, 200)),
        v.status === "rejected" ? "Profile is missing photos and packages. Please add them and we'll review again." : null],
    );
    const id = r.rows[0].id as number;

    for (const [j, p] of v.pkgs.entries()) {
      await pool.query("INSERT INTO packages (vendor_id, name, name_am, price, hours, inclusions, starting_from, position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [id, p[0], p[1], p[2], p[3], p[4], j === 0 && v.pkgs.length === 1, j]);
    }

    let n = 0;
    for (const s of tpl.sections) {
      if (s.kind === "gallery") {
        const count = v.status === "rejected" ? 0 : int(3, v.plan === "featured" ? 8 : 6);
        for (let k = 0; k < count; k++) {
          await pool.query("INSERT INTO portfolio_items (vendor_id, section, kind, url, caption, position) VALUES ($1,$2,'photo',$3,$4,$5)",
            [id, s.key, `/ph/${v.cat}-${i * 20 + n++}-${encodeURIComponent(s.title.en.split(/[ ,]/)[0])}.svg`, k === 0 ? s.title.en : null, k]);
        }
      } else if (s.kind === "media" && v.status !== "rejected") {
        const count = int(1, v.plan ? 3 : 1);
        for (let k = 0; k < count; k++) {
          await pool.query("INSERT INTO portfolio_items (vendor_id, section, kind, url, caption, position) VALUES ($1,$2,$3,$4,$5,$6)",
            [id, s.key, s.media === "audio" ? "audio" : "video", `https://example.com/sample-${s.media}-${id}-${k}`,
              pick(["Wedding at Sheraton Addis", "Engagement in Bole", "Melse at Skylight", "Graduation party", "Live set at Jazzamba"]), k]);
        }
      }
    }

    if (v.status) continue;

    // Booked dates over the next ~4 months, heavier on weekends.
    for (let d = 1; d < 120; d++) {
      const iso = addDays(today, d);
      const wd = new Date(iso).getUTCDay();
      if (rnd() < (wd === 0 || wd === 6 ? 0.35 : 0.05)) await pool.query("INSERT INTO availability (vendor_id, day) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id, iso]);
    }

    // Reviews
    const nReviews = int(0, 7);
    for (let k = 0; k < nReviews; k++) {
      const rating = rnd() < 0.8 ? int(4, 5) : int(2, 3);
      await pool.query(
        `INSERT INTO reviews (vendor_id, reviewer_name, reviewer_phone, rating, body, event_type, status, vendor_reply, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,'published',$7, now() - ($8 || ' days')::interval)`,
        [id, pick(REVIEWERS), `+2519${int(10000000, 99999999)}`, rating, rating >= 4 ? pick(GOOD) : pick(MEH),
          pick(["wedding", "wedding", "engagement", "birthday", "graduation", "baptism"]),
          rnd() < 0.3 ? "Thank you! It was a pleasure working with your family." : null, String(int(5, 300))],
      );
    }

    // Traffic for stats
    for (let d = 0; d < 30; d++) {
      const day = addDays(today, -d);
      const boost = v.plan === "featured" ? 3 : v.plan ? 2 : 1;
      await pool.query("INSERT INTO vendor_daily_stats (vendor_id, day, views, impressions) VALUES ($1,$2,$3,$4)", [id, day, int(0, 8) * boost, int(3, 25) * boost]);
      const taps = rnd() < 0.3 * boost ? int(1, boost) : 0;
      for (let k = 0; k < taps; k++) {
        await pool.query("INSERT INTO contact_events (vendor_id, channel, created_at) VALUES ($1,$2,$3::date + ($4 || ' hours')::interval)",
          [id, pick(["call", "call", "telegram", "whatsapp"]), day, String(int(8, 21))]);
      }
    }

    // Plans
    if (v.plan) {
      const plan = v.plan === "founding" ? "pro" : v.plan;
      const term = v.plan === "founding" ? "founding" : pick(["month", "season"]);
      const amount = v.plan === "founding" ? 0 : plan === "featured" ? (term === "month" ? 1800 : 4800) : (term === "month" ? 600 : 1600);
      const start = addDays(today, -int(3, 20));
      const end = addDays(start, (term === "month" ? 30 : 91) - 1);
      await pool.query("INSERT INTO subscriptions (vendor_id, plan, term, status, starts_on, ends_on, amount, chapa_ref) VALUES ($1,$2,$3,'active',$4,$5,$6,$7)",
        [id, plan, term, start, end, amount, amount ? `CHAPA-TX-${randomBytes(4).toString("hex").toUpperCase()}` : null]);
      if (plan === "featured") {
        for (const sc of subcities.slice(0, 2)) {
          await pool.query("INSERT INTO sponsored_slots (category, subcity, month, vendor_id) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING", [v.cat, sc, month, id]);
        }
      }
    }
  }

  // Moderation queue samples
  const sample = await pool.query("SELECT id FROM vendors WHERE status = 'approved' ORDER BY id LIMIT 3");
  await pool.query("INSERT INTO reviews (vendor_id, reviewer_name, reviewer_phone, rating, body, event_type) VALUES ($1, 'Kebede M.', '+251911223344', 5, 'Amazing work at our engagement, highly recommended to everyone!', 'engagement')", [sample.rows[0].id]);
  await pool.query("INSERT INTO reviews (vendor_id, reviewer_name, reviewer_phone, rating, body, status, flag_reason) VALUES ($1, 'Anonymous', '+251900000001', 1, 'Worst ever. Do not book.', 'flagged', 'We have no client with this name or number; we think this is a competitor.')", [sample.rows[1].id]);
  // A vendor asking to upgrade, waiting for a Chapa payment link
  await pool.query("INSERT INTO subscriptions (vendor_id, plan, term, amount) VALUES ($1, 'pro', 'season', 1600)", [sample.rows[2].id]);

  const counts = await pool.query("SELECT status, count(*) FROM vendors GROUP BY status");
  console.log("Seeded:", counts.rows.map((r) => `${r.count} ${r.status}`).join(", "));
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
