import { PrismaClient, GeographicReach } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Expanded industry segments
const industrySegments = [
  'Automotive', 'IoT', 'Defense', 'Consumer Electronics', 'Industrial Automation',
  'Electric Vehicles', 'Medical Devices', 'Aerospace', 'Telecommunications',
  'Computing & Data Centers', 'Wearables', 'Smart Home', 'Robotics', 'Energy & Power',
  '5G Infrastructure', 'AI & Machine Learning', 'Edge Computing', 'Quantum Computing'
];

// Expanded lead types (30+ categories)
const leadTypes = [
  // Semiconductor & Design
  { name: 'Analog / Mixed-Signal Design', category: 'SERVICE' as const },
  { name: 'Power IC Design', category: 'SERVICE' as const },
  { name: 'RF / MMIC Design', category: 'SERVICE' as const },
  { name: 'ASIC Design Services', category: 'SERVICE' as const },
  { name: 'IP Licensing & Verification', category: 'SERVICE' as const },
  { name: 'DFT (Design for Test)', category: 'SERVICE' as const },
  { name: 'Verification & RTL Design', category: 'SERVICE' as const },
  { name: 'FPGA → ASIC Conversion', category: 'SERVICE' as const },
  { name: 'Sensor / Analog IC Design', category: 'SERVICE' as const },

  // Manufacturing & Packaging
  { name: 'Advanced Packaging (Fan-Out, 2.5D, 3D)', category: 'SERVICE' as const },
  { name: 'IC Packaging (QFN / BGA)', category: 'SERVICE' as const },
  { name: 'Wafer Bumping', category: 'SERVICE' as const },
  { name: 'Substrate Manufacturing', category: 'PRODUCT' as const },
  { name: 'Leadframe Manufacturing', category: 'PRODUCT' as const },
  { name: 'Wire Bonding Services', category: 'SERVICE' as const },
  { name: 'Prototype Packaging', category: 'SERVICE' as const },

  // Testing & Validation
  { name: 'Wafer Testing', category: 'SERVICE' as const },
  { name: 'Final Testing (ATE)', category: 'SERVICE' as const },
  { name: 'Burn-In Testing', category: 'SERVICE' as const },
  { name: 'Failure Analysis', category: 'SERVICE' as const },
  { name: 'Reliability & Qualification', category: 'SERVICE' as const },
  { name: 'Automotive-Grade Testing (AEC-Q)', category: 'SERVICE' as const },
  { name: 'Environmental Testing', category: 'SERVICE' as const },
  { name: 'Post-Silicon Validation', category: 'SERVICE' as const },

  // Electronics & Systems
  { name: 'PCB Design & Layout', category: 'SERVICE' as const },
  { name: 'PCB Assembly (SMT/THT)', category: 'SERVICE' as const },
  { name: 'Box Build & System Integration', category: 'SERVICE' as const },
  { name: 'EV Electronics', category: 'PRODUCT' as const },
  { name: 'Industrial Automation Systems', category: 'PRODUCT' as const },
  { name: 'Medical Electronics', category: 'PRODUCT' as const },
  { name: 'Embedded System Integration', category: 'SERVICE' as const },

  // Equipment & Materials
  { name: 'Test Equipment Supply', category: 'PRODUCT' as const },
  { name: 'Automation / Test Equipment Integration', category: 'SERVICE' as const },
  { name: 'Cleanroom Setup', category: 'CAPABILITY' as const },
  { name: 'Raw Material Supply', category: 'PRODUCT' as const },
];

// Company data generator
const companyPrefixes = ['Advanced', 'Precision', 'Global', 'Micro', 'Nano', 'Silicon', 'Quantum', 'Smart', 'Integrated', 'Digital', 'Alpha', 'Beta', 'Prime', 'Elite', 'Pro', 'Tech', 'Mega', 'Ultra'];
const companySuffixes = ['Technologies', 'Systems', 'Solutions', 'Electronics', 'Semiconductors', 'Devices', 'Labs', 'Industries', 'Corp', 'Inc', 'Group', 'International', 'Innovations'];
const companyTypes = ['Design', 'ATMP', 'Testing', 'EMS', 'PCB', 'Equipment', 'Materials', 'OEM'];

const cities = {
  India: ['Bangalore', 'Chennai', 'Hyderabad', 'Mumbai', 'Pune', 'Gurgaon', 'Noida', 'Ahmedabad'],
  Taiwan: ['Hsinchu', 'Taipei', 'Taichung', 'Kaohsiung'],
  China: ['Shenzhen', 'Shanghai', 'Beijing', 'Suzhou', 'Wuhan'],
  USA: ['San Jose', 'Austin', 'Portland', 'Phoenix', 'Boston'],
  Singapore: ['Singapore'],
  Japan: ['Tokyo', 'Osaka', 'Yokohama'],
  'South Korea': ['Seoul', 'Suwon', 'Incheon'],
  Germany: ['Munich', 'Dresden', 'Stuttgart'],
  UK: ['Cambridge', 'London', 'Edinburgh']
};

const certifications = [
  'ISO 9001', 'ISO 13485', 'ISO 14001', 'IATF 16949', 'AS9100', 'IPC-A-610',
  'IPC-A-600', 'NABL', 'CE', 'FCC', 'RoHS', 'REACH', 'UL', 'TUV'
];

const companySizes = ['Startup', 'MSME', 'Large'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateCompanyName(): string {
  return `${randomElement(companyPrefixes)} ${randomElement(companySuffixes)}`;
}

function calculateDataCompleteness(company: any): number {
  let score = 0;
  if (company.email) score += 10;
  if (company.phone) score += 10;
  if (company.website) score += 10;
  if (company.certifications) score += 15;
  if (company.yearEstablished) score += 10;
  if (company.keyCapabilities?.length > 0) score += 15;
  if (company.servicesOffered?.length > 0) score += 15;
  if (company.industriesServed?.length > 0) score += 15;
  return score;
}

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // 1. Seed Industry Segments
  console.log('📊 Seeding industry segments...');
  const segments: { id: string; name: string }[] = [];
  for (const name of industrySegments) {
    const s = await prisma.industrySegment.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    segments.push(s);
  }
  console.log(`✅ Created ${segments.length} industry segments`);

  // 2. Seed Lead Types
  console.log('🏷️  Seeding lead types...');
  const leadTypeRecords: { id: string; name: string; slug: string }[] = [];
  for (const lt of leadTypes) {
    const slug = lt.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const record = await prisma.leadType.upsert({
      where: { slug },
      create: { name: lt.name, category: lt.category, slug },
      update: {},
    });
    leadTypeRecords.push(record);

    // Link to random industries
    const randomIndustries = randomElements(segments, Math.floor(Math.random() * 3) + 1);
    for (const ind of randomIndustries) {
      await prisma.leadTypeIndustry.upsert({
        where: {
          leadTypeId_industrySegmentId: {
            leadTypeId: record.id,
            industrySegmentId: ind.id,
          },
        },
        create: {
          leadTypeId: record.id,
          industrySegmentId: ind.id,
        },
        update: {},
      }).catch(() => { });
    }
  }
  console.log(`✅ Created ${leadTypeRecords.length} lead types`);

  // 3. Generate 500+ Company Profiles
  console.log('🏢 Generating 500+ company profiles...');
  const targetCompanies = 500;
  const companiesCreated = [];

  for (let i = 0; i < targetCompanies; i++) {
    const country = randomElement(Object.keys(cities));
    const city = randomElement(cities[country as keyof typeof cities]);
    const companyType = randomElement(companyTypes);
    const companySize = randomElement(companySizes);
    const category = companyType === 'OEM' ? 'BUYER' :
      Math.random() > 0.7 ? 'BOTH' : 'SUPPLIER';

    const yearEstablished = Math.floor(Math.random() * 30) + 1994; // 1994-2024
    const exportCapability = Math.random() > 0.4;
    const geographicReach: GeographicReach =
      country === 'USA' || country === 'Germany' || country === 'Japan' ? 'GLOBAL' :
        exportCapability ? 'NATIONAL' : 'LOCAL';

    // Select services based on company type
    let availableServices = leadTypeRecords.filter(lt => {
      if (companyType === 'Design') return lt.name.includes('Design') || lt.name.includes('Verification');
      if (companyType === 'ATMP') return lt.name.includes('Packaging') || lt.name.includes('Bumping');
      if (companyType === 'Testing') return lt.name.includes('Testing') || lt.name.includes('Validation');
      if (companyType === 'EMS') return lt.name.includes('System') || lt.name.includes('PCB');
      if (companyType === 'PCB') return lt.name.includes('PCB');
      if (companyType === 'Equipment') return lt.name.includes('Equipment') || lt.name.includes('Automation');
      if (companyType === 'Materials') return lt.name.includes('Material') || lt.name.includes('Substrate');
      return true;
    });

    if (availableServices.length === 0) availableServices = leadTypeRecords;

    const selectedServices = randomElements(availableServices, Math.floor(Math.random() * 4) + 1);
    const selectedIndustries = randomElements(segments, Math.floor(Math.random() * 4) + 2);
    const selectedCerts = Math.random() > 0.5 ? randomElements(certifications, Math.floor(Math.random() * 3) + 1).join(', ') : null;

    const keyCapabilities = selectedServices.map(s => s.name.split(' ')[0]);
    const minOrderQuantity = category === 'SUPPLIER' ?
      (Math.random() > 0.5 ? `${Math.floor(Math.random() * 500) + 100} units` : 'No MOQ') : null;

    const companyData = {
      companyName: `${generateCompanyName()} ${country !== 'India' ? country : ''}`.trim(),
      category: category as 'SUPPLIER' | 'BUYER' | 'BOTH',
      subCategory: companyType,
      servicesOffered: selectedServices.map(s => s.name),
      industriesServed: selectedIndustries.map(i => i.name),
      email: `contact@company${i}.example.com`,
      phone: `+${Math.floor(Math.random() * 100)}-${Math.floor(Math.random() * 1000000000)}`,
      website: `https://company${i}.example.com`,
      city,
      state: null,
      country,
      certifications: selectedCerts,
      notes: `${companyType} specialist serving ${selectedIndustries[0].name} sector`,
      companySize,
      yearEstablished,
      minOrderQuantity,
      exportCapability,
      geographicReach,
      keyCapabilities,
      dataCompleteness: 0, // Will calculate after
      isActive: Math.random() > 0.05, // 95% active
      lastVerified: Math.random() > 0.3 ? new Date() : null,
    };

    companyData.dataCompleteness = calculateDataCompleteness(companyData);

    try {
      const profile = await prisma.companyProfile.create({
        data: companyData,
      });

      // Link to industries
      for (const ind of selectedIndustries) {
        await prisma.companyProfileIndustry.create({
          data: {
            companyProfileId: profile.id,
            industrySegmentId: ind.id,
          },
        }).catch(() => { });
      }

      // Link as supplier or buyer
      if (category === 'SUPPLIER' || category === 'BOTH') {
        for (const service of selectedServices) {
          await prisma.companyLeadSupplier.create({
            data: {
              companyProfileId: profile.id,
              leadTypeId: service.id,
            },
          }).catch(() => { });
        }
      }

      if (category === 'BUYER' || category === 'BOTH') {
        const buyerNeeds = randomElements(leadTypeRecords, Math.floor(Math.random() * 3) + 1);
        for (const need of buyerNeeds) {
          await prisma.companyLeadBuyer.create({
            data: {
              companyProfileId: profile.id,
              leadTypeId: need.id,
            },
          }).catch(() => { });
        }
      }

      companiesCreated.push(profile);

      if ((i + 1) % 50 === 0) {
        console.log(`   ✓ Created ${i + 1}/${targetCompanies} companies...`);
      }
    } catch (error) {
      console.error(`Error creating company ${i}:`, error);
    }
  }

  console.log(`✅ Created ${companiesCreated.length} company profiles`);

  // 4. Create Admin and Demo Users
  console.log('👤 Creating admin and demo users...');
  const adminHash = await bcrypt.hash('admin123', 12);
  const demoCompany = await prisma.company.upsert({
    where: { id: 'demo-company-1' },
    create: {
      id: 'demo-company-1',
      name: 'Demo Electronics Corp',
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      searchLimitMonth: null,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    create: {
      email: 'admin@platform.com',
      passwordHash: adminHash,
      name: 'Platform Admin',
      role: 'ADMIN',
      companyId: null,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: 'demo@company.com' },
    create: {
      email: 'demo@company.com',
      passwordHash: await bcrypt.hash('demo123', 12),
      name: 'Demo User',
      role: 'COMPANY_ADMIN',
      companyId: demoCompany.id,
    },
    update: {},
  });

  console.log('✅ Admin and demo users created');
  console.log('\n🎉 Seed completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - ${segments.length} industry segments`);
  console.log(`   - ${leadTypeRecords.length} lead types`);
  console.log(`   - ${companiesCreated.length} company profiles`);
  console.log(`   - 2 users (admin + demo)`);
  console.log('\n🔑 Login credentials:');
  console.log('   Admin: admin@platform.com / admin123');
  console.log('   Demo:  demo@company.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
