import type { CategoryKey, L } from "./catalog";

// A portfolio template is a fixed set of sections in a fixed order. Every profile
// starts with the same header (name, photo, categories, sub-cities, starting price,
// rating, verified badge, contact buttons), then shows its category's sections.
//
// kinds:
//   gallery  - photos stored in portfolio_items with this section key
//   media    - video or audio links stored in portfolio_items
//   text     - free text, English and/or Amharic
//   tags     - pick from fixed options
//   packages - renders the vendor's packages

export type SectionKind = "gallery" | "media" | "text" | "tags" | "packages";

export type Section = {
  key: string;
  kind: SectionKind;
  title: L;
  prompt: L;
  example?: L;
  options?: { key: string; name: L }[];
  media?: "video" | "audio";
};

export type Template = { category: CategoryKey; sections: Section[] };

const packages = (prompt: L, example?: L): Section => ({
  key: "packages",
  kind: "packages",
  title: { en: "Packages and prices", am: "ፓኬጆችና ዋጋዎች" },
  prompt,
  example,
});

const opt = (key: string, en: string, am: string) => ({ key, name: { en, am } });

export const TEMPLATES: Record<CategoryKey, Template> = {
  photographer: {
    category: "photographer",
    sections: [
      { key: "wedding", kind: "gallery", title: { en: "Weddings", am: "ሰርግ" }, prompt: { en: "Pick your 6 best wedding photos", am: "ምርጥ 6 የሰርግ ፎቶዎችዎን ይምረጡ" } },
      { key: "events", kind: "gallery", title: { en: "Engagements, birthdays and graduations", am: "ቀለበት፣ ልደትና ምረቃ" }, prompt: { en: "Add photos from other event types", am: "ከሌሎች ዝግጅቶች ፎቶዎችን ያክሉ" } },
      { key: "studio", kind: "gallery", title: { en: "Studio portraits", am: "የስቱዲዮ ፎቶዎች" }, prompt: { en: "Do you shoot in a studio? Show a few portraits", am: "በስቱዲዮ ይሰራሉ? ጥቂት ፎቶዎች ያሳዩ" } },
      packages({ en: "How many edited photos do clients get? Include hours, album and delivery time", am: "ደንበኞች ስንት የተስተካከሉ ፎቶዎች ያገኛሉ? ሰዓት፣ አልበምና የማድረሻ ጊዜ ያካትቱ" }),
      { key: "equipment", kind: "text", title: { en: "Equipment", am: "መሳሪያዎች" }, prompt: { en: "Which cameras and lights do you bring?", am: "የትኞቹን ካሜራዎችና መብራቶች ይዘው ይመጣሉ?" }, example: { en: "Two full-frame cameras, flash and a backup drive", am: "ሁለት ፉል-ፍሬም ካሜራ፣ ፍላሽና መጠባበቂያ" } },
      { key: "second_shooter", kind: "text", title: { en: "Second shooter", am: "ሁለተኛ ፎቶግራፈር" }, prompt: { en: "Do you bring a second photographer?", am: "ሁለተኛ ፎቶግራፈር ይዘው ይመጣሉ?" }, example: { en: "Yes, on the Gold package", am: "አዎ፣ በጎልድ ፓኬጅ" } },
    ],
  },
  videographer: {
    category: "videographer",
    sections: [
      { key: "highlight", kind: "media", media: "video", title: { en: "Highlight reel", am: "አጭር ማሳያ ቪዲዮ" }, prompt: { en: "Upload your best 60-second highlight", am: "ምርጥ የ60 ሰከንድ ቪዲዮዎን ያክሉ" } },
      { key: "films", kind: "media", media: "video", title: { en: "Full films by event type", am: "ሙሉ ፊልሞች በዝግጅት አይነት" }, prompt: { en: "Link full wedding or event films", am: "ሙሉ የሰርግ ወይም የዝግጅት ፊልሞችን ያያይዙ" } },
      { key: "stills", kind: "gallery", title: { en: "Frames from our films", am: "ከፊልሞቻችን ምስሎች" }, prompt: { en: "Add a few still frames", am: "ጥቂት ምስሎችን ያክሉ" } },
      packages({ en: "Include hours, number of cameras, drone, edited length and delivery time", am: "ሰዓት፣ የካሜራ ብዛት፣ ድሮን፣ የቪዲዮ ርዝመትና የማድረሻ ጊዜ ያካትቱ" }),
      { key: "drone", kind: "text", title: { en: "Drone", am: "ድሮን" }, prompt: { en: "Do you offer drone shots?", am: "የድሮን ቀረጻ ይሰጣሉ?" }, example: { en: "Yes, licensed drone on outdoor events", am: "አዎ፣ ከቤት ውጭ ዝግጅቶች" } },
    ],
  },
  makeup: {
    category: "makeup",
    sections: [
      { key: "before_after", kind: "gallery", title: { en: "Before and after", am: "በፊትና በኋላ" }, prompt: { en: "Add a before-and-after of a bridal look", am: "የሙሽሪት ሜካፕ በፊትና በኋላ ፎቶ ያክሉ" } },
      { key: "looks", kind: "tags", title: { en: "Looks", am: "የሜካፕ አይነቶች" }, prompt: { en: "Which looks do you do?", am: "የትኞቹን አይነቶች ይሰራሉ?" }, options: [opt("bridal", "Bridal", "የሙሽሪት"), opt("traditional", "Traditional", "ባህላዊ"), opt("soft_glam", "Soft glam", "ሶፍት ግላም"), opt("party", "Party", "የፓርቲ"), opt("men", "Grooming for men", "ለወንዶች")] },
      { key: "gallery", kind: "gallery", title: { en: "Gallery", am: "ፎቶዎች" }, prompt: { en: "Show your best looks", am: "ምርጥ ስራዎችዎን ያሳዩ" } },
      packages({ en: "Bride, bridesmaids, trial session, home visit", am: "ሙሽሪት፣ ሚዜዎች፣ የሙከራ ቀጠሮ፣ ቤት ድረስ" }),
      { key: "products", kind: "text", title: { en: "Products used", am: "የምንጠቀማቸው ምርቶች" }, prompt: { en: "Which brands do you use?", am: "የትኞቹን ብራንዶች ይጠቀማሉ?" }, example: { en: "MAC, Huda Beauty, Fenty", am: "MAC፣ Huda Beauty፣ Fenty" } },
      { key: "travel", kind: "text", title: { en: "Home visits", am: "ቤት ድረስ አገልግሎት" }, prompt: { en: "Do you travel to the client?", am: "ወደ ደንበኛ ቤት ይሄዳሉ?" }, example: { en: "Yes, anywhere in Addis; transport added for Akaky", am: "አዎ፣ በአዲስ አበባ ውስጥ" } },
    ],
  },
  decorator: {
    category: "decorator",
    sections: [
      { key: "before_after", kind: "gallery", title: { en: "Venues before and after", am: "አዳራሾች በፊትና በኋላ" }, prompt: { en: "Show one hall before and after", am: "አንድ አዳራሽ በፊትና በኋላ ያሳዩ" } },
      { key: "themes", kind: "tags", title: { en: "Themes", am: "ጭብጦች" }, prompt: { en: "Which themes do you do?", am: "የትኞቹን ጭብጦች ይሰራሉ?" }, options: [opt("traditional", "Traditional", "ባህላዊ"), opt("modern", "Modern", "ዘመናዊ"), opt("outdoor", "Outdoor", "ከቤት ውጭ"), opt("tent", "Tent", "ድንኳን")] },
      { key: "gallery", kind: "gallery", title: { en: "Our work", am: "ስራዎቻችን" }, prompt: { en: "Add your best setups", am: "ምርጥ ዝግጅቶችዎን ያክሉ" } },
      packages({ en: "What is your price for 200 guests? Price packages by guest count", am: "ለ200 እንግዶች ዋጋዎ ስንት ነው? በእንግዶች ብዛት ይመድቡ" }),
      { key: "items", kind: "text", title: { en: "Items included", am: "የተካተቱ እቃዎች" }, prompt: { en: "Flowers, lighting, backdrops, chairs?", am: "አበባ፣ መብራት፣ ዳራ፣ ወንበር?" }, example: { en: "Fresh flowers, fairy lights, stage backdrop, chair covers", am: "ትኩስ አበባ፣ መብራት፣ የመድረክ ዳራ፣ የወንበር ልብስ" } },
    ],
  },
  planner: {
    category: "planner",
    sections: [
      { key: "story", kind: "text", title: { en: "An event from start to finish", am: "አንድ ዝግጅት ከመጀመሪያ እስከ መጨረሻ" }, prompt: { en: "Describe one event from start to finish", am: "አንድ ዝግጅት ከመጀመሪያ እስከ መጨረሻ ይግለጹ" }, example: { en: "A 400-guest wedding at Hyatt: we booked 8 vendors in 6 weeks...", am: "በሃያት የ400 እንግዶች ሰርግ..." } },
      { key: "events", kind: "gallery", title: { en: "Past events", am: "ያለፉ ዝግጅቶች" }, prompt: { en: "Add photos from events you ran", am: "ካስተባበሯቸው ዝግጅቶች ፎቶዎች ያክሉ" } },
      { key: "services", kind: "tags", title: { en: "Services", am: "አገልግሎቶች" }, prompt: { en: "Which services do you include?", am: "የትኞቹን አገልግሎቶች ያካትታሉ?" }, options: [opt("full", "Full planning", "ሙሉ እቅድ"), opt("day_of", "Day-of coordination", "የዕለቱ ማስተባበር"), opt("budget", "Budget planning", "የበጀት እቅድ"), opt("diaspora", "Planning for diaspora families", "ለዳያስፖራ ቤተሰቦች")] },
      { key: "partners", kind: "text", title: { en: "Vendors we work with", am: "አብረን የምንሰራቸው" }, prompt: { en: "Which vendors do you often work with?", am: "ከየትኞቹ ባለሙያዎች ጋር ይሰራሉ?" } },
      packages({ en: "Full planning, day-of, hourly", am: "ሙሉ እቅድ፣ የዕለቱ፣ በሰዓት" }),
    ],
  },
  dj: {
    category: "dj",
    sections: [
      { key: "mix", kind: "media", media: "audio", title: { en: "Mix sample", am: "የሙዚቃ ናሙና" }, prompt: { en: "Upload a 60-second mix", am: "የ60 ሰከንድ ሚክስ ያክሉ" } },
      { key: "styles", kind: "tags", title: { en: "Music styles", am: "የሙዚቃ አይነቶች" }, prompt: { en: "What do you play?", am: "ምን አይነት ሙዚቃ ይጫወታሉ?" }, options: [opt("ethiopian", "Ethiopian", "ኢትዮጵያዊ"), opt("afrobeat", "Afrobeat", "አፍሮቢት"), opt("international", "International", "ዓለም አቀፍ"), opt("gospel", "Gospel", "መንፈሳዊ"), opt("oldies", "Ethiopian oldies", "የድሮ ዘፈኖች")] },
      { key: "gallery", kind: "gallery", title: { en: "At events", am: "በዝግጅቶች ላይ" }, prompt: { en: "Photos of your setup and crowd", am: "የመሳሪያዎና የታዳሚ ፎቶዎች" } },
      { key: "equipment", kind: "text", title: { en: "Sound and lighting", am: "ድምጽና መብራት" }, prompt: { en: "Do you bring your own speakers and lights?", am: "የራስዎን ስፒከርና መብራት ይዘው ይመጣሉ?" }, example: { en: "Yes: 2 x 15\" tops, 2 subs, moving heads, fog machine", am: "አዎ፡ ስፒከሮች፣ ሳብ፣ መብራቶች" } },
      packages({ en: "Packages by hours", am: "ፓኬጆች በሰዓት" }),
    ],
  },
  singer: {
    category: "singer",
    sections: [
      { key: "performances", kind: "media", media: "video", title: { en: "Live performances", am: "የቀጥታ ስራዎች" }, prompt: { en: "Add a live performance clip", am: "የቀጥታ ስራ ቪዲዮ ያክሉ" } },
      { key: "song_types", kind: "tags", title: { en: "Song types", am: "የዘፈን አይነቶች" }, prompt: { en: "What do you sing?", am: "ምን ይዘፍናሉ?" }, options: [opt("traditional", "Traditional", "ባህላዊ"), opt("wedding", "Wedding songs", "የሰርግ ዘፈኖች"), opt("modern", "Modern", "ዘመናዊ"), opt("gospel", "Gospel", "መንፈሳዊ")] },
      { key: "languages", kind: "text", title: { en: "Languages", am: "ቋንቋዎች" }, prompt: { en: "Which languages do you sing in?", am: "በየትኞቹ ቋንቋዎች ይዘፍናሉ?" }, example: { en: "Amharic, Afaan Oromo, Tigrinya, English", am: "አማርኛ፣ ኦሮምኛ፣ ትግርኛ፣ እንግሊዝኛ" } },
      { key: "gallery", kind: "gallery", title: { en: "Photos", am: "ፎቶዎች" }, prompt: { en: "Add stage photos", am: "የመድረክ ፎቶዎች ያክሉ" } },
      packages({ en: "Number of songs, with or without band", am: "የዘፈን ብዛት፣ ከባንድ ጋር ወይም ያለ ባንድ" }),
    ],
  },
  band: {
    category: "band",
    sections: [
      { key: "performances", kind: "media", media: "video", title: { en: "Live performances", am: "የቀጥታ ስራዎች" }, prompt: { en: "Add a live performance video", am: "የቀጥታ ስራ ቪዲዮ ያክሉ" } },
      { key: "members", kind: "text", title: { en: "Members and instruments", am: "አባላትና መሳሪያዎች" }, prompt: { en: "List your members and instruments", am: "አባላትዎንና መሳሪያዎቻቸውን ይዘርዝሩ" }, example: { en: "Vocals, keyboard, bass, drums, saxophone, krar", am: "ድምጻዊ፣ ኪቦርድ፣ ቤዝ፣ ድራም፣ ሳክስፎን፣ ክራር" } },
      { key: "genres", kind: "tags", title: { en: "Genres", am: "የሙዚቃ ዘውጎች" }, prompt: { en: "What do you play?", am: "ምን ይጫወታሉ?" }, options: [opt("ethio_jazz", "Ethio-jazz", "ኢትዮ-ጃዝ"), opt("traditional", "Traditional", "ባህላዊ"), opt("pop", "Pop and covers", "ፖፕ"), opt("gospel", "Gospel", "መንፈሳዊ"), opt("reggae", "Reggae", "ሬጌ")] },
      { key: "equipment", kind: "text", title: { en: "Equipment and venue needs", am: "መሳሪያና ከአዳራሹ የሚያስፈልግ" }, prompt: { en: "Do you need a stage or power from the venue?", am: "መድረክ ወይም ኤሌክትሪክ ከአዳራሹ ያስፈልጋል?" }, example: { en: "We bring a full PA; we need a 4x3 m stage and two power points", am: "ሙሉ ድምጽ ማጉያ እናመጣለን፤ መድረክና ኤሌክትሪክ ያስፈልጋል" } },
      { key: "gallery", kind: "gallery", title: { en: "Photos", am: "ፎቶዎች" }, prompt: { en: "Add stage photos", am: "የመድረክ ፎቶዎች ያክሉ" } },
      packages({ en: "Packages by hours and set length", am: "ፓኬጆች በሰዓትና በስብስብ ርዝመት" }),
    ],
  },
  baker: {
    category: "baker",
    sections: [
      { key: "wedding", kind: "gallery", title: { en: "Wedding cakes", am: "የሰርግ ኬኮች" }, prompt: { en: "Show your tiered wedding cakes", am: "የሰርግ ኬኮችዎን ያሳዩ" } },
      { key: "other", kind: "gallery", title: { en: "Birthday cakes, cupcakes and breads", am: "የልደት ኬክ፣ ካፕኬክና ዳቦ" }, prompt: { en: "Add birthday cakes, cupcakes and traditional breads", am: "የልደት ኬክ፣ ካፕኬክና ባህላዊ ዳቦ ያክሉ" } },
      { key: "flavours", kind: "text", title: { en: "Flavours", am: "ጣዕሞች" }, prompt: { en: "Which flavours do you offer?", am: "የትኞቹን ጣዕሞች ያቀርባሉ?" }, example: { en: "Vanilla, chocolate, red velvet, coffee, mango", am: "ቫኒላ፣ ቸኮሌት፣ ሬድ ቬልቬት፣ ቡና፣ ማንጎ" } },
      packages({ en: "Sizes, servings and price by guest count", am: "መጠን፣ ለስንት ሰውና ዋጋ" }),
      { key: "delivery", kind: "text", title: { en: "Delivery and setup", am: "ማድረስና ማዘጋጀት" }, prompt: { en: "Do you deliver?", am: "ያደርሳሉ?" }, example: { en: "Free delivery and setup in Bole and Kirkos", am: "በቦሌና ቂርቆስ በነጻ እናደርሳለን" } },
      { key: "lead_time", kind: "text", title: { en: "Order lead time", am: "የትዕዛዝ ጊዜ" }, prompt: { en: "How many days before the event do you need the order?", am: "ከዝግጅቱ ስንት ቀን በፊት ትዕዛዝ ያስፈልጋል?" }, example: { en: "Wedding cakes: 14 days. Birthday cakes: 3 days", am: "የሰርግ ኬክ፡ 14 ቀን። የልደት ኬክ፡ 3 ቀን" } },
    ],
  },
  painter: {
    category: "painter",
    sections: [
      { key: "gallery", kind: "gallery", title: { en: "Gallery", am: "ስራዎች" }, prompt: { en: "Live event painting, portraits, murals, decor painting", am: "የቀጥታ ዝግጅት ስዕል፣ ፖርትሬት፣ የግድግዳ ስዕል" } },
      { key: "process", kind: "media", media: "video", title: { en: "Live painting process", am: "የቀጥታ ስዕል ሂደት" }, prompt: { en: "Do you paint live at the event? Show it", am: "በዝግጅቱ ላይ በቀጥታ ይስላሉ? ያሳዩ" } },
      { key: "sizes", kind: "text", title: { en: "Sizes", am: "መጠኖች" }, prompt: { en: "What sizes do you offer?", am: "ምን መጠኖች ያቀርባሉ?" }, example: { en: "40x50 cm up to 120x90 cm canvas", am: "ከ40x50 እስከ 120x90 ሴ.ሜ" } },
      { key: "time", kind: "text", title: { en: "Time needed", am: "የሚያስፈልግ ጊዜ" }, prompt: { en: "How long does a piece take?", am: "አንድ ስራ ስንት ጊዜ ይወስዳል?" }, example: { en: "Live: 3–4 hours during the event. Portraits: 1 week", am: "ቀጥታ፡ 3–4 ሰዓት። ፖርትሬት፡ 1 ሳምንት" } },
      packages({ en: "Sizes and prices", am: "መጠንና ዋጋ" }),
    ],
  },
};

export function template(category: string): Template | undefined {
  return TEMPLATES[category as CategoryKey];
}

export const LOOKS = [
  { key: "classic", name: { en: "Classic", am: "ክላሲክ" }, paid: false },
  { key: "modern", name: { en: "Modern", am: "ዘመናዊ" }, paid: false },
  { key: "bold", name: { en: "Bold", am: "ደማቅ" }, paid: false },
  { key: "gold", name: { en: "Gold (Pro)", am: "ወርቃማ (ፕሮ)" }, paid: true },
  { key: "night", name: { en: "Night (Pro)", am: "ምሽት (ፕሮ)" }, paid: true },
] as const;
