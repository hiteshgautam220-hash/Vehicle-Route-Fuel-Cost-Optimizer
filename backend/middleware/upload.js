/**
 * RouteWise Backend — File Upload Middleware (Multer)
 * Demonstrates safe file upload handling, diskStorage configuration,
 * MIME type & file extension validation, size limits (2MB), and sanitized filenames.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const baseUploadDir = path.join(__dirname, '..', 'uploads');
const avatarUploadDir = path.join(baseUploadDir, 'avatars');
const tripUploadDir = path.join(baseUploadDir, 'trips');

[baseUploadDir, avatarUploadDir, tripUploadDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure disk storage with randomized, unique, safe filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'avatar') {
            cb(null, avatarUploadDir);
        } else {
            cb(null, tripUploadDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File filter: Validate MIME type and file extension to prevent executable upload exploits
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mime)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`), false);
    }
};

const maxFileSize = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 2) * 1024 * 1024; // 2MB default

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize
    }
});

/**
 * Wrapper middleware for handling multer errors cleanly
 */
function handleUpload(uploader) {
    return (req, res, next) => {
        uploader(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: `File too large. Maximum allowed size is ${maxFileSize / (1024 * 1024)}MB.`
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: `File upload error: ${err.message}`
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            next();
        });
    };
}

module.exports = {
    uploadAvatar: handleUpload(upload.single('avatar')),
    uploadTripAttachment: handleUpload(upload.single('attachment'))
};
