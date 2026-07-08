const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route GET /api/resources — Get all resources with filters
router.get('/', protect, async (req, res) => {
  try {
    const { category, subject, type, search, page = 1, limit = 15 } = req.query;
    const query = { isApproved: true };
    if (category) query.category = category;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (type) query.type = type;
    if (search) query.$text = { $search: search };

    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('uploadedBy', 'name profilePicture role');

    res.json({ success: true, total, resources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route POST /api/resources — Upload a resource
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, subject, type, url, tags } = req.body;
    if (!title || !category || !type)
      return res.status(400).json({ error: 'Title, category, and type are required' });

    const resourceUrl = req.file ? `/uploads/${req.file.filename}` : url;
    if (!resourceUrl) return res.status(400).json({ error: 'Provide a file or URL' });

    const resource = await Resource.create({
      title,
      description,
      category,
      subject,
      type,
      url: resourceUrl,
      filename: req.file ? req.file.originalname : '',
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      uploadedBy: req.user._id,
    });
    await resource.populate('uploadedBy', 'name profilePicture');
    res.status(201).json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route GET /api/resources/subjects — Get grouped subject resources by semester
router.get('/subjects', protect, async (req, res) => {
  try {
    const semesterMapping = {
      'Semester I': [
        { name: 'LAC', matches: ['lac', 'linear algebra', 'calculus'] },
        {
          name: 'ENGG. GRAP',
          matches: ['engg. grap', 'engineering graphics', 'graphics', 'drawing'],
        },
        { name: 'CHEM', matches: ['chem', 'chemistry'] },
        { name: 'BCME', matches: ['bcme', 'civil & mechanical', 'basic civil'] },
        { name: 'HWYS', matches: ['hwys', 'health & wellness', 'sports'] },
        { name: 'C-LANG', matches: ['c-lang', 'c programming', 'c language'] },
        { name: 'CHEM LAB', matches: ['chem lab', 'chemistry lab'] },
        { name: 'CPL', matches: ['cpl', 'computer programming lab'] },
        { name: 'EWS', matches: ['ews', 'engineering workshop'] },
      ],
      'Semester II': [
        { name: 'NSS', matches: ['nss', 'national service scheme'] },
        { name: 'DEVC', matches: ['devc', 'differential equations', 'vector calculus'] },
        { name: 'EP', matches: ['ep', 'engineering physics', 'physics'] },
        { name: 'CE', matches: ['ce', 'communicative english', 'english'] },
        { name: 'BEEE', matches: ['beee', 'electrical & electronics'] },
        { name: 'DS', matches: ['ds', 'data structures'] },
        { name: 'CE LAB', matches: ['ce lab', 'english lab'] },
        { name: 'EP LAB', matches: ['ep lab', 'physics lab'] },
        { name: 'EEE LAB', matches: ['eee lab', 'electrical lab'] },
        { name: 'DS LAB', matches: ['ds lab', 'data structures lab'] },
        { name: 'IT WS', matches: ['it ws', 'it workshop'] },
      ],
      'Semester III': [
        { name: 'MFCS', matches: ['mfcs', 'mathematical foundations'] },
        { name: 'UHV', matches: ['uhv', 'universal human values', 'human values'] },
        { name: 'DL&CO', matches: ['dl&co', 'digital logic', 'computer organization'] },
        { name: 'SE', matches: ['se', 'software engineering'] },
        {
          name: 'OOPS JAVA',
          matches: ['oops java', 'oop through java', 'java', 'object oriented'],
        },
        { name: 'ES', matches: ['es', 'environmental science'] },
        { name: 'CT Lab', matches: ['ct lab', 'computer technology lab'] },
        { name: 'JAVA LAB', matches: ['java lab', 'java programming lab'] },
        { name: 'FSD', matches: ['fsd', 'full stack development'] },
      ],
      'Higher Semesters': [
        { name: 'DBMS', matches: ['dbms', 'database'] },
        { name: 'Operating Systems', matches: ['operating systems', 'os'] },
        { name: 'Computer Networks', matches: ['computer networks', 'cn'] },
        { name: 'Python Programming', matches: ['python programming', 'python'] },
      ],
    };

    const resources = await Resource.find({
      category: 'core-subjects',
      isApproved: true,
    })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name');

    const result = {};
    for (const [semName, subs] of Object.entries(semesterMapping)) {
      result[semName] = {};
      for (const sub of subs) {
        result[semName][sub.name] = [];
      }
    }

    for (const r of resources) {
      const subjectName = r.subject || '';
      let matched = false;
      for (const [semName, subs] of Object.entries(semesterMapping)) {
        for (const sub of subs) {
          if (sub.matches.some((term) => subjectName.toLowerCase().includes(term))) {
            result[semName][sub.name].push(r);
            matched = true;
          }
        }
      }
      if (!matched && subjectName) {
        if (!result['Higher Semesters']) {
          result['Higher Semesters'] = {};
        }
        if (!result['Higher Semesters'][subjectName]) {
          result['Higher Semesters'][subjectName] = [];
        }
        result['Higher Semesters'][subjectName].push(r);
      }
    }

    res.json({ success: true, semesters: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/resources/:id/like
router.put('/:id/like', protect, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    const idx = resource.likes.indexOf(req.user._id);
    if (idx === -1) resource.likes.push(req.user._id);
    else resource.likes.splice(idx, 1);
    await resource.save();
    res.json({ success: true, likes: resource.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route PUT /api/resources/:id/download — Increment download count
router.put('/:id/download', protect, async (req, res) => {
  try {
    await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
