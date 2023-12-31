const mongoose = require('mongoose');

const Glasses = new mongoose.Schema({
    name: {
        type: String,
        // required: true
    },
    sku: {
        type: String,
    },
    description: {
        type: String,
    },
    sku_model: {
        type: String,
    },
    frame_shape: {
        type: String,
    },
    rim_shape: {
        type: String,
    },
    priceInfo: {
        price: {
            type: Number,
            // required: true
        },
        currency: {
            type: String,
            // required: true
        }
    },
    discount: {
        type: Number,
    },
    type: {
        type: String,
        // required: true
    },
    meta: {
        meta_title: {
            type: String,
        },
        meta_keywords: [{
            type: String,
        }],
        meta_description: {
            type: String,
        },
    },
    manufacturer: {
        type: String,
    },
    frame_information: {
        frame_material: [{
            type: String,
        }],
        frame_size: [{
            type: String,
        }],
        frame_variants: [{
            color: {
                type: String,
            },
            color_code: {
                type: String
            },
            quantity: {
                type: Number,
            },
            images: [],
        }],
    },
    lens_information: {
        measurement_type: {
            type: String
        },
        lens_width: {
            type: Number,
        },
        lens_height: {
            type: Number,
        },
        total_width: {
            type: Number,
        },
        bridge_width: {
            type: Number,
        },
        temple_length: {
            type: Number,
        },
        is_multifocal: {
            type: Boolean,
        }
    },
    person_information: {
        face_shape: [{
            type: String,
        }],
        genders: [{
            type: String,
        }],
    },
    stock: {
        is_low_stock: {
            type: Boolean,
            default: false
        },
        is_out_of_stock: {
            type: Boolean,
            default: false
        },
        is_in_stock: {
            type: Boolean,
            default: false
        },
        is_to_be_announced: {
            type: Boolean,
            default: false
        },
    },
    reviewsInformation: {
        total_reviews: {
            type: Number,
            default: 0
        },
        user_reviews: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }],
    },
    categories: [{
        type: String,
    }],
    createdAt: {
        type: Date,
        default: Date.now, 
    },
});

module.exports = mongoose.model('Glasses', Glasses);