/**
 * seed/seedNGOs.js
 * Populates MongoDB with the curated Surat NGO / support-centre dataset.
 *
 * Run with:  npm run seed
 *
 * The data was researched from reliable public sources (official government
 * websites, official organisation sites and established directories) in
 * August 2026. Every record carries a "source" field.
 *
 * The script is idempotent: it upserts by organisation name, so running it
 * multiple times will NOT create duplicate records.
 *
 * NOTE: Coordinates are approximate (for map display). Actual addresses are
 * stored in the address field and used for directions links.
 * PLEASE VERIFY contact details before real-world use.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const NGO = require('../server/models/NGO');
const Admin = require('../server/models/Admin');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/breakfree';

const ngos = [
  // ============================================================
  // GOVERNMENT SUPPORT (verified from official government sources)
  // ============================================================
  {
    name: 'SMIMER Hospital - Psychiatry Department (De-addiction / SUGAM & Tobacco Cessation Clinics)',
    shortDescription:
      'Government (Surat Municipal Corporation) hospital with a dedicated psychiatry department offering de-addiction services for alcohol, tobacco, opioids, cannabis and more at nominal charges.',
    description:
      'SMIMER is the Surat Municipal Corporation teaching hospital. Its Psychiatry Department runs an OPD (Room 24 & 25, ground floor), indoor ward, emergency care for substance intoxication/withdrawal, a De-addiction / SUGAM clinic (Fridays 3-5 PM), a Tobacco Cessation Clinic (Tuesdays 3-5 PM), and daily family counselling (11 AM-1 PM). Treatment includes pharmacotherapy, psychotherapy and de-addiction therapy for alcohol, tobacco/nicotine, opioids, cannabis and benzodiazepines. Patients are advised to attend the first consultation with a close relative.',
    address: 'OPD Room 24 & 25, Ground Floor, SMIMER Hospital, Near Sahara Darwaja, Surat, Gujarat 395010',
    area: 'Sahara Darwaja',
    city: 'Surat',
    latitude: 21.2199,
    longitude: 72.8586,
    phone: '0261-2368040',
    alternatePhone: '',
    email: '',
    website: 'https://www.suratmunicipal.gov.in/smimer/Departments/Psychiatry/Facilities',
    services: ['de-addiction', 'counselling', 'outpatient', 'medical-support', 'family-counselling'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'gutkha', 'pan-masala', 'nicotine', 'cannabis', 'opioids', 'prescription', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'hospital',
    pricingType: 'low-cost',
    timings: 'Psychiatry OPD 9 AM-1 PM & 3-5 PM; De-addiction/SUGAM clinic Friday 3-5 PM; Tobacco Cessation Clinic Tuesday 3-5 PM; Family counselling daily 11 AM-1 PM',
    verified: true,
    source: 'https://www.suratmunicipal.gov.in/smimer/Departments/Psychiatry/Facilities (official Surat Municipal Corporation website)'
  },
  {
    name: 'New Civil Hospital (Government Medical College), Surat',
    shortDescription:
      'Major government tertiary-care hospital with psychiatric services including substance-use de-addiction treatment at subsidised government rates.',
    description:
      'New Civil Hospital (NCH) is one of the largest government hospitals in South Gujarat, attached to Government Medical College, Surat. Its Psychiatry Department provides consultations, counselling and de-addiction treatment for substance use (alcohol, tobacco and drug dependence) at low government rates, along with referral services. Emergency and inpatient psychiatric care are available.',
    address: 'Opposite ICC Trade Center, Near Majura Gate, Ring Road, Jay Prakash Narayan Marg, Surat, Gujarat 395001',
    area: 'Majura Gate',
    city: 'Surat',
    latitude: 21.203,
    longitude: 72.832,
    phone: '0261-2244456',
    alternatePhone: '0261-2244457',
    email: '',
    website: 'http://www.nchsurat.org',
    services: ['de-addiction', 'counselling', 'outpatient', 'medical-support', 'awareness'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'gutkha', 'pan-masala', 'nicotine', 'cannabis', 'opioids', 'prescription', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'hospital',
    pricingType: 'low-cost',
    timings: 'Not available (government hospital OPD - contact to confirm)',
    verified: true,
    source: 'https://surat.nic.in/public-utility/new-civil-hospital/ (District Surat official site) & http://www.nchsurat.org'
  },

  // ============================================================
  // PRIVATE HOSPITALS / CLINICS (directory-verified)
  // ============================================================
  {
    name: 'SOCH - Institute of Mental Health and De-addiction',
    shortDescription:
      'Psychiatric hospital in Surat run by a team of psychiatrists, offering de-addiction, counselling and outpatient/inpatient mental health care.',
    description:
      'SOCH - Institute of Mental Health and De-addiction is a psychiatric hospital located at Sunshine Global Hospital, Piplod. It offers de-addiction services, psychiatric consultations, counselling and mental health treatment. Contact them directly for details on services, doctors and fees.',
    address: '7th Floor, Sunshine Global Hospital, Beside Big Bazar, Dumas-Piplod Road, Piplod, Surat, Gujarat 395007',
    area: 'Piplod',
    city: 'Surat',
    latitude: 21.1664,
    longitude: 72.7921,
    phone: '7474849436',
    alternatePhone: '0261-4111000',
    email: 'help@mentalhospitalsurat.com',
    website: 'https://mentalhospitalsurat.com',
    services: ['de-addiction', 'counselling', 'rehabilitation', 'outpatient', 'medical-support', 'family-counselling'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'gutkha', 'pan-masala', 'nicotine', 'cannabis', 'opioids', 'heroin', 'cocaine', 'synthetic', 'prescription', 'inhalants', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'hospital',
    pricingType: 'paid',
    timings: 'Not available (contact the institute)',
    verified: true,
    source: 'https://mentalhospitalsurat.com (official website) & public directories'
  },
  {
    name: 'Aura Mental Health and Clinic',
    shortDescription:
      'Psychiatric clinic by an addiction-medicine specialist (DM Addiction, AIIMS) offering non-judgemental care for addiction and mental health concerns.',
    description:
      'Aura Mental Health and Clinic at Majura Gate is run by Dr. Piyush Goyal, a psychiatrist and addiction specialist. The clinic provides treatment and counselling for alcohol, smoking and drug addiction along with general mental health care (depression, anxiety, OCD, relationship issues). A non-judgemental approach is emphasised.',
    address: 'Majura Gate, Surat, Gujarat',
    area: 'Majura Gate',
    city: 'Surat',
    latitude: 21.2032,
    longitude: 72.8319,
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'counselling', 'outpatient', 'medical-support'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'gutkha', 'pan-masala', 'nicotine', 'cannabis', 'opioids', 'heroin', 'cocaine', 'synthetic', 'prescription', 'inhalants', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'clinic',
    pricingType: 'paid',
    timings: 'Opens 11:00 AM (per directory listing)',
    verified: true,
    source: 'https://www.sulekha.com/aura-mental-health-and-clinic-majura-gate-surat-contact-address (directory listing)'
  },
  {
    name: 'Manoshuddhi Psychiatry Clinic',
    shortDescription:
      'Psychiatry clinic in Vesu providing de-addiction treatment, counselling, detox, smoking cessation and mental health care.',
    description:
      'Manoshuddhi Psychiatry Clinic is located at Marcelo Business Center, VIP Road, Vesu. Services include alcoholism treatment, drug addiction treatment, detoxification, substance-abuse counselling, depression care and smoking cessation.',
    address: '301-302, Marcelo Business Center, VIP Road, Vesu, Surat, Gujarat',
    area: 'Vesu',
    city: 'Surat',
    latitude: 21.133,
    longitude: 72.755,
    phone: '9023437136',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'counselling', 'outpatient', 'medical-support'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'nicotine', 'cannabis', 'opioids', 'prescription', 'synthetic', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'clinic',
    pricingType: 'paid',
    timings: 'Not available (contact the clinic)',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/manoshuddhi-psychiatry-clinic/ (directory listing)'
  },
  {
    name: 'Divyam Hospital',
    shortDescription:
      'Hospital in Palsana offering alcohol and drug de-addiction treatment, detoxification, rehabilitation and family counselling.',
    description:
      'Divyam Hospital is located on NH-8, behind S D Jain International School, Palsana (Surat district). It offers alcoholism and drug addiction treatment, detoxification, residential rehabilitation, relapse prevention, family counselling and 12-step support.',
    address: 'NH-8, Behind S D Jain International School, Palsana, Surat, Gujarat 394315',
    area: 'Palsana',
    city: 'Surat',
    latitude: 21.075,
    longitude: 72.9575,
    phone: '9104488855',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'rehabilitation', 'residential', 'counselling', 'family-counselling', 'medical-support'],
    addictionTypes: ['alcohol', 'cannabis', 'opioids', 'heroin', 'cocaine', 'synthetic', 'prescription', 'inhalants', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'hospital',
    pricingType: 'paid',
    timings: 'Not available (contact the hospital)',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/divyam-hospital/ (directory listing)'
  },
  {
    name: 'Divyam Institute of Psychiatry',
    shortDescription:
      'Psychiatry institute in Palsana providing de-addiction and mental health consultations.',
    description:
      'Divyam Institute of Psychiatry is a directory-verified psychiatric facility in Palsana, Surat district (pin 394315) offering de-addiction and psychiatric consultations. Contact them directly for full details.',
    address: 'Palsana, Surat, Gujarat 394315',
    area: 'Palsana',
    city: 'Surat',
    latitude: 21.075,
    longitude: 72.9575,
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'counselling', 'medical-support'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'nicotine', 'cannabis', 'opioids', 'prescription', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'clinic',
    pricingType: 'paid',
    timings: 'Not available (contact the institute)',
    verified: true,
    source: 'https://www.sulekha.com/divyam-institute-of-psychiatry-palsana-surat-contact-address (directory listing)'
  },
  {
    name: 'Dr. Samir Psychiatric Clinic & De-addiction Centre',
    shortDescription:
      'Psychiatric clinic with a de-addiction centre offering drug addiction treatment in Surat.',
    description:
      'Dr. Samir Psychiatric Clinic & De-addiction Centre, located at Kashi Plaza in Surat, provides drug addiction treatment and psychiatric consultations. Contact the centre directly for treatment details and fees.',
    address: 'HJ-8, Kashi Plaza, Surat, Gujarat 395003',
    area: 'Not available',
    city: 'Surat',
    latitude: null,
    longitude: null,
    phone: '0261-2234555',
    alternatePhone: '9909648104',
    email: '',
    website: '',
    services: ['de-addiction', 'counselling', 'medical-support'],
    addictionTypes: ['alcohol', 'cannabis', 'opioids', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'clinic',
    pricingType: 'paid',
    timings: 'Not available (contact the clinic)',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/dr-samir-psychiatric-clinic-deaddiction-centre/ (directory listing)'
  },
  {
    name: 'Aatman De-Addiction',
    shortDescription:
      'De-addiction service in Surat offering alcohol and drug addiction treatment with counselling.',
    description:
      'Aatman De-Addiction is a directory-listed de-addiction service located at Shreeji Arcade, Surat, offering alcoholism treatment, drug addiction treatment and substance-abuse counselling. Contact them directly for details.',
    address: 'B-603, 6th Floor, Shreeji Arcade, Surat, Gujarat',
    area: 'Not available',
    city: 'Surat',
    latitude: null,
    longitude: null,
    phone: '0261-2748084',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'counselling'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'nicotine', 'cannabis', 'opioids', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'clinic',
    pricingType: 'not-available',
    timings: 'Not available (contact the service)',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/aatman-de-addiction/ (directory listing)'
  },
  {
    name: 'Alcohol De-addiction Centre, Surat',
    shortDescription:
      'De-addiction centre near Delhi Gate offering alcohol and drug addiction treatment.',
    description:
      'The Alcohol De-addiction Centre, Surat is located at Nav Nidhi Complex near Delhi Gate Circle (Mahidharpura / Haripura area). It offers alcohol and drug de-addiction treatment. Contact the centre directly for details.',
    address: 'Shop No. U-6, Nav Nidhi Complex, Delhi Gate Circle, Mahidharpura, Surat, Gujarat 395003',
    area: 'Delhi Gate',
    city: 'Surat',
    latitude: 21.2052,
    longitude: 72.8378,
    phone: '9724318833',
    alternatePhone: '0261-2452915',
    email: '',
    website: '',
    services: ['de-addiction', 'counselling'],
    addictionTypes: ['alcohol', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'clinic',
    pricingType: 'not-available',
    timings: 'Not available (contact the centre)',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/alcohol-deaddiction-center-surat/ & https://city.webindia123.com/d-t/gujarat/surat/alcohol-de-addiction-center/18883/ (directory listings)'
  },

  // ============================================================
  // RESIDENTIAL REHABILITATION CENTRES (directory-verified)
  // ============================================================
  {
    name: 'Turning Point Wellness Centre',
    shortDescription:
      'Residential rehabilitation centre near Dumas offering holistic, evidence-based treatment for addiction and mental health.',
    description:
      'Turning Point Wellness Centre is a residential rehabilitation facility at VK Farm, Village Gavier, Dumas, Surat. It uses holistic and evidence-based approaches and offers detoxification, alcoholism and drug addiction treatment, substance-abuse counselling, smoking cessation, family services, relapse prevention, 12-step support, AA/NA meetings, yoga and meditation.',
    address: '265, VK Farm, Village Gavier, Dumas, Surat, Gujarat 394305',
    area: 'Dumas',
    city: 'Surat',
    latitude: 21.0889,
    longitude: 72.7066,
    phone: '7622929242',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'rehabilitation', 'residential', 'counselling', 'outpatient', 'family-counselling', 'awareness'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'gutkha', 'pan-masala', 'nicotine', 'cannabis', 'opioids', 'heroin', 'cocaine', 'synthetic', 'prescription', 'inhalants', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'rehab-centre',
    pricingType: 'paid',
    timings: 'Open 24 hours',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/turning-point-wellness-centre/ & https://findrehabcentres.com/centre/turning-point-de-addiction-rehab-surat-gujarat-394305/ (directory listings)'
  },
  {
    name: 'Turning Point Sapphire',
    shortDescription:
      "Residential rehabilitation facility with a dedicated women's program, near Magdalla, Dumas Road.",
    description:
      "Turning Point Sapphire is a residential rehabilitation centre at VK Farms, Magdalla Port, Dumas Road, Surat. It offers alcoholism and drug addiction treatment, detoxification, substance-abuse counselling, mental health care, smoking cessation, yoga, meditation and a dedicated women's program.",
    address: 'Plot 315, VK Farms, Magdalla Port, Dumas Road, Gaviyer, Surat, Gujarat',
    area: 'Dumas',
    city: 'Surat',
    latitude: 21.135,
    longitude: 72.727,
    phone: '7600440000',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'rehabilitation', 'residential', 'counselling', 'family-counselling', 'awareness'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'gutkha', 'pan-masala', 'nicotine', 'cannabis', 'opioids', 'heroin', 'cocaine', 'synthetic', 'prescription', 'inhalants', 'multiple'],
    genderSupported: ['female', 'all'],
    facilityType: 'rehab-centre',
    pricingType: 'paid',
    timings: 'Not available (contact the centre)',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/6550518/ (directory listing)'
  },
  {
    name: 'Parivartan De-addiction cum Rehabilitation Centre',
    shortDescription:
      'Residential de-addiction and rehabilitation centre (unit of Nashabandhi Mandal) in Chowk Bazaar offering detoxification, counselling and family services.',
    description:
      'Parivartan De-addiction cum Rehabilitation Centre is a unit of Nashabandhi Mandal, located at Chowk Bazaar, Surat. It offers alcoholism and drug addiction treatment, detoxification, residential rehabilitation, substance-abuse counselling, family services, yoga and meditation.',
    address: 'Nursing Home Quarters, Ground Floor, Chowk Bazaar, Surat, Gujarat 395001',
    area: 'Chowk Bazaar',
    city: 'Surat',
    latitude: 21.1904,
    longitude: 72.8155,
    phone: '0261-2479292',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'rehabilitation', 'residential', 'counselling', 'family-counselling', 'awareness'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'nicotine', 'cannabis', 'opioids', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'rehab-centre',
    pricingType: 'not-available',
    timings: 'Not available (contact the centre)',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/parivartan-de-addiction-cum-rehabilitation-centre/ & https://findrehabcentres.com/centre/parivartan-de-addiction-cum-rehabilitation-centre-surat-gujarat-395001/ (directory listings)'
  },
  {
    name: 'Trucare Trust - Surat',
    shortDescription:
      'Trust-run Nasha Mukti Kendra providing residential de-addiction and rehabilitation with 12-step support, AA/NA meetings and family services.',
    description:
      'Trucare Trust is a residential rehabilitation organisation with a Nasha Mukti Kendra presence in Surat. Services include detoxification, drug addiction treatment, residential rehabilitation, smoking cessation, substance-abuse counselling, family services, 12-step / AA / NA meetings, yoga and meditation, with a focus on youth substance abuse.',
    address: 'Surat, Gujarat (city-wide service - contact the trust for the exact facility location)',
    area: 'Not available',
    city: 'Surat',
    latitude: null,
    longitude: null,
    phone: '7874933999',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'rehabilitation', 'residential', 'counselling', 'awareness', 'family-counselling'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'gutkha', 'pan-masala', 'nicotine', 'cannabis', 'opioids', 'heroin', 'cocaine', 'synthetic', 'prescription', 'inhalants', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'ngo-trust',
    pricingType: 'not-available',
    timings: 'Not available (contact the trust)',
    verified: true,
    source: 'https://rehabs.in/rehabcentre/trucare-trust-surat/ (directory listing)'
  },
  {
    name: 'Well Care Nasha Mukti Kendra',
    shortDescription:
      'De-addiction centre on Varachha Road helping people free themselves from drug, alcohol and behavioural addictions.',
    description:
      'Well Care Nasha Mukti Kendra is a de-addiction centre located on Varachha Road, Surat. Per its directory listing it provides de-addiction services for substance addictions (drugs, alcohol) as well as behavioural addictions (mobile, stock market). Contact the centre directly for treatment details.',
    address: 'Varachha Road, Surat, Gujarat',
    area: 'Varachha',
    city: 'Surat',
    latitude: 21.2451,
    longitude: 72.8732,
    phone: '',
    alternatePhone: '',
    email: '',
    website: '',
    services: ['de-addiction', 'rehabilitation', 'residential', 'counselling'],
    addictionTypes: ['alcohol', 'smoking', 'tobacco', 'gutkha', 'pan-masala', 'nicotine', 'cannabis', 'opioids', 'multiple'],
    genderSupported: ['all'],
    facilityType: 'rehab-centre',
    pricingType: 'not-available',
    timings: 'Open 24 hours',
    verified: true,
    source: 'https://www.sulekha.com/well-care-nasha-mukti-kendra-varachha-road-surat-contact-address (directory listing)'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);

    // ---- NGOs (upsert by name -> safe to run multiple times) ----
    let inserted = 0;
    let updated = 0;
    for (const ngoData of ngos) {
      const existing = await NGO.findOne({ name: ngoData.name });
      if (existing) {
        await NGO.updateOne({ _id: existing._id }, ngoData);
        updated += 1;
        console.log(`= Updated: ${ngoData.name}`);
      } else {
        await NGO.create(ngoData);
        inserted += 1;
        console.log(`+ Added:  ${ngoData.name}`);
      }
    }

    // ---- Default admin (only if no admin exists yet) ----
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = bcrypt.hashSync(password, 10);
      await Admin.create({ username, passwordHash });
      console.log(`\nCreated default admin account: "${username}" (password from .env or "admin123").`);
      console.log('IMPORTANT: change the password for anything beyond demo use.');
    } else {
      console.log(`\nAdmin account already exists (${adminCount} user(s)) - skipped.`);
    }

    const totalNGOs = await NGO.countDocuments();
    console.log(
      `\nSeeding complete. ${inserted} added, ${updated} updated. Total NGOs in database: ${totalNGOs}`
    );
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();