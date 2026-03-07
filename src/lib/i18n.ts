export type Locale = 'en' | 'ms'

export const translations = {
  en: {
    hero: {
      title: 'Be Part of Something Bigger',
      subtitle:
        'Your regular contribution powers youth programmes, education, community welfare and more. Set up in under 2 minutes.',
      cta: 'Start My Pledge',
      tagline: 'Join fellow donors making a difference at Ar-Raudhah',
    },
    howItWorks: {
      title: 'How It Works',
      step1: {
        title: '1. Pledge',
        desc: 'Choose your amount and frequency in under 2 minutes',
      },
      step2: {
        title: '2. Pay',
        desc: 'Scan the PayNow QR or transfer via bank \u2014 takes 15 seconds',
      },
      step3: {
        title: '3. Track',
        desc: 'See your giving history and where your donations could go',
      },
    },
    initiatives: {
      title: 'What Your Donation Powers',
      subtitle:
        "Ar-Raudhah runs programmes for every age group \u2014 from kids to seniors. Here\u2019s how your support makes an impact.",
      youth: {
        title: 'Youth Development',
        desc: 'Mentorship circles, leadership camps, sports programmes, and career guidance for teens and young adults.',
      },
      education: {
        title: 'Religious Education',
        desc: 'Weekly Quran classes, Islamic studies for all levels, and enrichment programmes for children and adults.',
      },
      welfare: {
        title: 'Community Welfare',
        desc: 'Financial assistance for families, food distribution drives, and support services for those in need.',
      },
      dawah: {
        title: "Da'wah & Outreach",
        desc: 'Community events, interfaith dialogues, and public talks that bring people together.',
      },
      explore: 'Explore all Ar-Raudhah programmes',
    },
    transparency: {
      title: 'See Where Your Donation Goes',
      donate: 'Donate any amount from $10/month',
    },
    footer: {
      mosque: 'Masjid Ar-Raudhah',
      address: '1 Jln Kuak, Singapore 799316',
      tagline: 'A Skim Pintar Initiative',
    },
  },
  ms: {
    hero: {
      title: 'Jadilah Sebahagian daripada Sesuatu yang Lebih Besar',
      subtitle:
        'Sumbangan tetap anda memacu program belia, pendidikan, kebajikan masyarakat dan banyak lagi. Daftar dalam masa kurang 2 minit.',
      cta: 'Mula Ikrar Saya',
      tagline: 'Sertai penderma lain yang membuat perubahan di Ar-Raudhah',
    },
    howItWorks: {
      title: 'Cara Ia Berfungsi',
      step1: {
        title: '1. Ikrar',
        desc: 'Pilih jumlah dan kekerapan anda dalam masa kurang 2 minit',
      },
      step2: {
        title: '2. Bayar',
        desc: 'Imbas QR PayNow atau pindah wang melalui bank \u2014 15 saat sahaja',
      },
      step3: {
        title: '3. Jejak',
        desc: 'Lihat sejarah pemberian anda dan ke mana sumbangan anda disalurkan',
      },
    },
    initiatives: {
      title: 'Apa yang Sumbangan Anda Kuasakan',
      subtitle:
        'Ar-Raudhah menjalankan program untuk semua peringkat umur \u2014 dari kanak-kanak hingga warga emas. Inilah cara sokongan anda memberi kesan.',
      youth: {
        title: 'Pembangunan Belia',
        desc: 'Mentorship, kem kepimpinan, program sukan, dan bimbingan kerjaya untuk remaja dan belia.',
      },
      education: {
        title: 'Pendidikan Agama',
        desc: 'Kelas Al-Quran mingguan, pengajian Islam untuk semua peringkat, dan program pengayaan.',
      },
      welfare: {
        title: 'Kebajikan Masyarakat',
        desc: 'Bantuan kewangan untuk keluarga, agihan makanan, dan perkhidmatan sokongan untuk yang memerlukan.',
      },
      dawah: {
        title: "Da'wah & Jangkauan",
        desc: 'Acara komuniti, dialog antara agama, dan ceramah awam yang menyatukan masyarakat.',
      },
      explore: 'Terokai semua program Ar-Raudhah',
    },
    transparency: {
      title: 'Lihat Ke Mana Sumbangan Anda Disalurkan',
      donate: 'Sumbang sebarang jumlah dari $10/bulan',
    },
    footer: {
      mosque: 'Masjid Ar-Raudhah',
      address: '1 Jln Kuak, Singapura 799316',
      tagline: 'Inisiatif Skim Pintar',
    },
  },
} as const
