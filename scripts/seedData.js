/* eslint-env node */
// Seed script to populate teachers, classes, parents, and students into the running backend API (http://localhost:5000)

const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, raw: responseBody });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Seeding MMS database via http://localhost:5000 ...');

  // 1. Teachers
  const sampleTeachers = [
    {
      name: 'Qari Tariq Jameel Sahib',
      phone: '03001234567',
      email: 'qari.tariq@mms.edu',
      cnic: '42101-1122334-1',
      role: 'Hifz Teacher',
      status: 'Active',
    },
    {
      name: 'Maulana Bilal Ahmad',
      phone: '03219876543',
      email: 'bilal.ahmad@mms.edu',
      cnic: '35201-5566778-3',
      role: 'Darse Nizami Teacher',
      status: 'Active',
    },
    {
      name: 'Sheikh Abdul Wahab',
      phone: '03334445566',
      email: 'wahab.sheikh@mms.edu',
      cnic: '61101-7788990-5',
      role: 'Head Teacher',
      status: 'Active',
    },
    {
      name: 'Qari Saeed-ur-Rehman',
      phone: '03456677889',
      email: 'saeed.rehman@mms.edu',
      cnic: '37405-3344556-7',
      role: 'Tajweed Teacher',
      status: 'Active',
    },
    {
      name: 'Maulana Zubair Usmani',
      phone: '03125556677',
      email: 'zubair.usmani@mms.edu',
      cnic: '42201-9988776-9',
      role: 'Nazra Teacher',
      status: 'Active',
    },
  ];

  const teacherIds = [];
  for (const t of sampleTeachers) {
    const res = await postJson('/api/teachers', t);
    if (res.data && res.data.teacher && res.data.teacher._id) {
      console.log(`✓ Teacher created: ${t.name} (${res.data.teacher._id})`);
      teacherIds.push(res.data.teacher._id);
    } else {
      console.log(`• Teacher status (${t.name}):`, res.data ? res.data.message : res.statusCode);
    }
  }

  // Fetch all teachers to get IDs if already existing
  const teachersList = await getJson('/api/teachers');
  const allTeachers = teachersList.teachers || [];
  console.log(`Total Teachers now in DB: ${allTeachers.length}`);

  // 2. Classes
  const sampleClasses = [
    {
      name: 'Shoba-e-Tahfeez (Hifz) - Batch A',
      section: 'A',
      roomNumber: '101',
      classTeacher: allTeachers[0]?._id,
      academicYear: '2026-2027',
      status: 'Active',
    },
    {
      name: 'Shoba-e-Tahfeez (Hifz) - Batch B',
      section: 'B',
      roomNumber: '102',
      classTeacher: allTeachers[0]?._id,
      academicYear: '2026-2027',
      status: 'Active',
    },
    {
      name: 'Dars-e-Nizami (Sanwiya Khasa)',
      section: 'A',
      roomNumber: '201',
      classTeacher: allTeachers[1]?._id,
      academicYear: '2026-2027',
      status: 'Active',
    },
    {
      name: 'Tajweed & Qiraat Academy',
      section: 'A',
      roomNumber: '204',
      classTeacher: allTeachers[3]?._id,
      academicYear: '2026-2027',
      status: 'Active',
    },
    {
      name: 'Nazra Quran & Ibtidaiyya',
      section: 'C',
      roomNumber: '105',
      classTeacher: allTeachers[4]?._id,
      academicYear: '2026-2027',
      status: 'Active',
    },
  ];

  for (const c of sampleClasses) {
    const res = await postJson('/api/classes', c);
    if (res.data && res.data.class) {
      console.log(`✓ Class created: ${c.name} (${res.data.class._id})`);
    } else {
      console.log(`• Class status (${c.name}):`, res.data ? res.data.message : res.statusCode);
    }
  }

  const classesList = await getJson('/api/classes');
  const allClasses = classesList.classes || [];
  console.log(`Total Classes now in DB: ${allClasses.length}`);

  // 3. Students & Parents (via Admin Student Registration POST /api/students)
  const sampleStudents = [
    {
      fullName: 'Muhammad Huzaifa Tariq',
      fatherName: 'Abdul Rehman',
      dob: '2012-05-14',
      gender: 'Male',
      bFormNo: '42101-1234567-1',
      admissionDate: '2026-01-10',
      classId: allClasses[0]?._id,
      status: 'Enrolled',
      parentName: 'Abdul Rehman',
      parentPhone: '03001234567',
      parentCnic: '42101-1234567-1',
      parentAddress: 'Sector 5-A, North Nazimabad, Karachi',
      parentPassword: 'password123',
    },
    {
      fullName: 'Abdullah Rehman',
      fatherName: 'Abdul Rehman',
      dob: '2014-08-20',
      gender: 'Male',
      bFormNo: '42101-7654321-2',
      admissionDate: '2026-02-01',
      classId: allClasses[1]?._id,
      status: 'Enrolled',
      parentName: 'Abdul Rehman',
      parentPhone: '03001234567',
      parentCnic: '42101-1234567-1',
      parentAddress: 'Sector 5-A, North Nazimabad, Karachi',
      parentPassword: 'password123',
    },
    {
      fullName: 'Hamza Farooq',
      fatherName: 'Haji Farooq Azam',
      dob: '2011-11-03',
      gender: 'Male',
      bFormNo: '35201-9988776-3',
      admissionDate: '2026-01-15',
      classId: allClasses[2]?._id,
      status: 'Enrolled',
      parentName: 'Haji Farooq Azam',
      parentPhone: '03214455667',
      parentCnic: '35201-9988776-3',
      parentAddress: 'Allama Iqbal Town, Lahore',
      parentPassword: 'password123',
    },
    {
      fullName: 'Usman Ghani Rizwan',
      fatherName: 'Muhammad Rizwan',
      dob: '2013-04-12',
      gender: 'Male',
      bFormNo: '61101-3344556-5',
      admissionDate: '2026-02-10',
      classId: allClasses[3]?._id,
      status: 'Enrolled',
      parentName: 'Muhammad Rizwan',
      parentPhone: '03335557788',
      parentCnic: '61101-3344556-5',
      parentAddress: 'Street 9, G-10/4, Islamabad',
      parentPassword: 'password123',
    },
    {
      fullName: 'Anas Irfan',
      fatherName: 'Dr. Irfanullah',
      dob: '2015-09-08',
      gender: 'Male',
      bFormNo: '17301-4455667-9',
      admissionDate: '2026-03-01',
      classId: allClasses[4]?._id,
      status: 'Enrolled',
      parentName: 'Dr. Irfanullah',
      parentPhone: '03459988776',
      parentCnic: '17301-4455667-9',
      parentAddress: 'University Town, Peshawar',
      parentPassword: 'password123',
    },
  ];

  for (const s of sampleStudents) {
    if (!s.classId) continue;
    const res = await postJson('/api/students', s);
    if (res.data && res.data.student) {
      console.log(`✓ Student & Parent created: ${s.fullName} (Roll: ${res.data.student.rollNo})`);
    } else {
      console.log(`• Student status (${s.fullName}):`, res.data ? res.data.message : res.statusCode);
    }
  }

  // Final summary
  const finalParents = await getJson('/api/parents');
  const finalStudents = await getJson('/api/students');
  console.log('\n--- SEED COMPLETE ---');
  console.log(`Teachers: ${allTeachers.length}`);
  console.log(`Classes:  ${allClasses.length}`);
  console.log(`Parents:  ${finalParents.count || finalParents.parents?.length || 0}`);
  console.log(`Students: ${finalStudents.count || finalStudents.students?.length || 0}`);
}

main().catch(console.error);
