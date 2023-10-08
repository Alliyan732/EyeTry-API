const mongoose = require('mongoose');
const CounterModel = require('./OrderCounter'); // Import the Counter schema

const OrderSchema = new mongoose.Schema({

    order_no: {
        type: Number,
        unique: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    items: [{
        frame: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Glasses'
        },
        quantity: {
            type: Number,
            required: true
          },
          frameProperties: {
              frameSize: {
                  type: String,
                  required: true
              },
              frameColor: {
                  type: String,
                  required: true
              },
          },
          lensProperties: {
              lensType: String,
              prescriptionType: String,
              package: String,
              coatings: String,
              glassesType: String,
              upgrades: String,
              transitionLens: {
                  transitionType: String,
                  transitionColor: String,
              },
              sunglassesLens: {
                  sunglassesType: String,
                  color: String,
              },
          },
          prescription: {
              pdType: String,
              pdOneNumber: Number,
              pdLeftNumber: Number,
              pdRightNumber: Number,
              birthYear: Number,
              leftEyeOS: {
                  SPH: Number,
                  CYL: Number,
                  Axis: Number,
                  Prism: Number,
                  Base: Number,
              },
              rightEyeOD: {
                  SPH: Number,
                  CYL: Number,
                  Axis: Number,
                  Prism: Number,
                  Base: Number,
              },
          },
    }
    ],

    totalPrice: {
        type: String,
        required: true
    },

    paymentMethod : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },

    shippingAddress: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
    },  
    
    orderDate: {     
        type: Date,
        default: Date.now,
    },

});

// Middleware to auto-increment order_no
OrderSchema.pre('save', async function () {
    const order = this;

    // Find and increment the sequence_value in the Counter collection
    try {
        const counter = await CounterModel.findOneAndUpdate(
            { _id: 'order_no' }, // Change to 'order_no'
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true }
        );

        order.order_no = counter.sequence_value; // Change to 'order_no'
    } catch (err) {
        throw err; // Handle the error appropriately
    }
});

// Create the Mongoose model
const OrderModel = mongoose.model('Order', OrderSchema);

module.exports = OrderModel;
