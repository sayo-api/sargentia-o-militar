const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'military_system/notices';
    let resource_type = 'auto';

    if (file.mimetype.startsWith('image/')) {
      folder = 'military_system/images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'military_system/videos';
      resource_type = 'video';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'military_system/documents';
      resource_type = 'raw';
    } else if (
      file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('excel') ||
      file.mimetype.includes('xlsx') ||
      file.mimetype.includes('csv')
    ) {
      folder = 'military_system/documents';
      resource_type = 'raw';
    }

    return {
      folder,
      resource_type,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'pdf', 'xlsx', 'xls', 'csv', 'doc', 'docx'],
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = { cloudinary, upload };
