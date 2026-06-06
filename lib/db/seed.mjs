import pg from "pg";

const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// ── Products ──
await client.query(`
  INSERT INTO products (name, name_bn, category, price, unit, quantity, district, seller_name, seller_phone, description, is_organic)
  VALUES
    ('Boro Rice','বোরো ধান','ধান',1200,'মণ',50,'ময়মনসিংহ','মো. আবুল হোসেন','01711234567','উচ্চ ফলনশীল বোরো ধান, সতেজ ও পরিষ্কার',false),
    ('Tomato','টমেটো','সবজি',35,'কেজি',200,'রাজশাহী','রহিমা বেগম','01812345678','জৈব পদ্ধতিতে চাষ করা তাজা টমেটো',true),
    ('Potato','আলু','সবজি',22,'কেজি',500,'মুন্সিগঞ্জ','কামাল উদ্দিন','01913456789','ডায়মন্ড জাতের আলু, মাঝারি আকার',false),
    ('Mustard','সরিষা','তেলবীজ',3200,'মণ',20,'কুষ্টিয়া','আনোয়ার হোসেন','01614567890','উচ্চ মানের দেশীয় সরিষা',false),
    ('Green Chili','কাঁচা মরিচ','মসলা',80,'কেজি',100,'বগুড়া','ফাতেমা খানম','01715678901','তীব্র ঝাল, তাজা সংগৃহীত',true),
    ('Lentil','মসুর ডাল','ডাল',110,'কেজি',150,'চাঁপাইনবাবগঞ্জ','জামাল উদ্দিন','01816789012','দেশীয় মসুর ডাল, উচ্চমান',false),
    ('Eggplant','বেগুন','সবজি',28,'কেজি',80,'যশোর','শিরিন আক্তার','01917890123','বড় জাতের বেগুন, কীটনাশকমুক্ত',true),
    ('Garlic','রসুন','মসলা',160,'কেজি',60,'রাজশাহী','নুরুল ইসলাম','01618901234','দেশী রসুন, পুষ্ট ও শুকানো',false),
    ('Onion','পেঁয়াজ','মসলা',45,'কেজি',300,'ফরিদপুর','মজিবুর রহমান','01719012345','মাঝারি আকারের লাল পেঁয়াজ',false),
    ('Mango','আম','ফল',65,'কেজি',400,'রাজশাহী','গোলাম মোস্তফা','01820123456','হিমসাগর আম, সম্পূর্ণ পাকা',true),
    ('Wheat','গম','গম',950,'মণ',30,'দিনাজপুর','সিদ্দিকুর রহমান','01921234567','কানাডিয়ান জাতের গম, উচ্চ প্রোটিন',false),
    ('Jute','পাট','অন্যান্য',2800,'মণ',15,'ফরিদপুর','হাবিবুর রহমান','01622345678','সোনালী পাট, উচ্চ গ্রেড',false)
  ON CONFLICT DO NOTHING
`);

// ── Questions & Answers ──
const q1 = await client.query(`
  INSERT INTO questions (title, body, category, farmer_name, district, is_resolved)
  VALUES ('ধানের পাতা হলুদ হয়ে যাচ্ছে, কী করব?', 'আমার বোরো ধানের পাতা নিচ থেকে হলুদ হয়ে যাচ্ছে এবং কিছু পাতা শুকিয়ে যাচ্ছে। সার দিয়েছি তবুও কাজ হচ্ছে না।', 'ধান', 'মো. রফিকুল ইসলাম', 'ময়মনসিংহ', true)
  RETURNING id
`);
await client.query(`
  INSERT INTO answers (question_id, body, author_name, is_expert)
  VALUES
    ($1, 'এটি সম্ভবত নাইট্রোজেনের ঘাটতি বা লিফ ব্লাইট রোগের লক্ষণ। ইউরিয়া সার প্রয়োগ করুন এবং জমিতে পানি নিষ্কাশন নিশ্চিত করুন। প্রয়োজনে ট্রাইসাইক্লাজল ছত্রাকনাশক ব্যবহার করতে পারেন।', 'ড. মোহাম্মদ আলী', true),
    ($1, 'আমারও একই সমস্যা হয়েছিল। ইউরিয়া ও পটাশ সার একসাথে দিয়ে সমাধান পেয়েছি।', 'আব্দুল করিম', false)
`, [q1.rows[0].id]);

const q2 = await client.query(`
  INSERT INTO questions (title, body, category, farmer_name, district, is_resolved)
  VALUES ('টমেটোর গোড়া পচে যাচ্ছে', 'টমেটো গাছের গোড়া কালো হয়ে পচে যাচ্ছে। ফল ধরার আগেই গাছ মরে যাচ্ছে। কোন রোগ এবং প্রতিকার কী?', 'সবজি', 'সুফিয়া বেগম', 'রাজশাহী', false)
  RETURNING id
`);
await client.query(`
  INSERT INTO answers (question_id, body, author_name, is_expert)
  VALUES
    ($1, 'এটি ড্যাম্পিং অফ বা ফুসেরিয়াম উইল্ট রোগ। কার্বেন্ডাজিম বা থায়োফানেট মিথাইল দিয়ে মাটি শোধন করুন। আক্রান্ত গাছ তুলে ফেলুন এবং পানি জমতে দেবেন না।', 'কৃষিবিদ রহিম উদ্দিন', true)
`, [q2.rows[0].id]);

const q3 = await client.query(`
  INSERT INTO questions (title, body, category, farmer_name, district, is_resolved)
  VALUES ('কোন সার কতটুকু দিতে হবে বোরো ধানে?', 'বিঘা প্রতি বোরো ধানে কোন কোন সার কী পরিমাণে দিতে হবে? আমি প্রথমবার চাষ করছি।', 'সার', 'জহির উদ্দিন', 'সিলেট', false)
  RETURNING id
`);
await client.query(`
  INSERT INTO answers (question_id, body, author_name, is_expert)
  VALUES
    ($1, 'বিঘা প্রতি ইউরিয়া ২৫ কেজি, টিএসপি ১৫ কেজি, এমওপি ১২ কেজি এবং জিপসাম ১০ কেজি দিন। ইউরিয়া তিন ভাগে (রোপণ, কুশি, এবং থোড় পর্যায়ে) দিন।', 'ড. ফারুক আহমেদ', true)
`, [q3.rows[0].id]);

await client.query(`
  INSERT INTO questions (title, body, category, farmer_name, district, is_resolved)
  VALUES
    ('আলু বীজ সংরক্ষণ পদ্ধতি কী?', 'পরের মৌসুমের জন্য আলু বীজ সংরক্ষণ করতে চাই। কীভাবে করব?', 'অন্যান্য', 'হানিফ মিয়া', 'মুন্সিগঞ্জ', false),
    ('পেঁয়াজের পাতা পাকানো হয়ে যাচ্ছে', 'পেঁয়াজের পাতা মাঝামাঝি থেকে বাঁকা হয়ে পাকিয়ে যাচ্ছে। এটা কোন রোগ?', 'মসলা', 'নাজমা বেগম', 'ফরিদপুর', false),
    ('সবজি চাষে জৈব সার ব্যবহার করব কীভাবে?', 'রাসায়নিক সার না দিয়ে জৈব সার দিয়ে সবজি চাষ করতে চাই। পদ্ধতি জানাবেন?', 'সবজি', 'করিম মিয়া', 'খুলনা', false)
  ON CONFLICT DO NOTHING
`);

// ── Consultants ──
await client.query(`
  INSERT INTO consultants (name, name_bn, specialization, specialization_bn, district, experience, rating, total_sessions, available, fee)
  VALUES
    ('Dr. Mohammad Ali','ড. মোহাম্মদ আলী','Plant Pathology','উদ্ভিদ রোগতত্ত্ব','ঢাকা',15,4.9,320,true,500),
    ('Dr. Rahim Uddin','ড. রহিম উদ্দিন','Soil Science','মৃত্তিকা বিজ্ঞান','রাজশাহী',12,4.7,280,true,400),
    ('Dr. Faruk Ahmed','ড. ফারুক আহমেদ','Agronomy','শস্যবিদ্যা','চট্টগ্রাম',10,4.8,195,true,450),
    ('Dr. Nasrin Akter','ড. নাসরিন আক্তার','Horticulture','উদ্যানবিজ্ঞান','ময়মনসিংহ',8,4.6,150,true,350),
    ('Dr. Kamal Hossain','ড. কামাল হোসেন','Entomology','কীটতত্ত্ব','সিলেট',11,4.5,210,false,400),
    ('Dr. Selina Begum','ড. সেলিনা বেগম','Agricultural Economics','কৃষি অর্থনীতি','খুলনা',9,4.7,175,true,300)
  ON CONFLICT DO NOTHING
`);

await client.end();
console.log("Seed complete!");
