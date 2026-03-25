// const axios = require('axios');
// const otpService = async (mobile, message) => {
//   const bypassNumbers = ['9316755406', '9876543210', '1234567890']; // Add your 3 numbers here
//   if (bypassNumbers.includes(mobile)) {
//     console.log(`:construction: Bypassing OTP for test number: ${mobile}`);
//     return true; // Simulate success
//   }
//   const apiKey = process.env.FACTOR_KEY;
//   if (!apiKey) {
//     console.error(':x: FACTOR_KEY environment variable is not set');
//     return false;
//   }
  
//   // URL encode the message properly
//   const encodedMessage = encodeURIComponent(message);
//   const url = `https://sms.mobileadz.in/api/push.json?apikey=${apiKey}&route=trans_dnd&sender=FLASHB&mobileno=${mobile}&text=${encodedMessage}`;
  
//   try {
//     const response = await axios.get(url);
//     if (response.data && response.data.Status === 'Success') {
//       console.log(':white_check_mark: OTP sent successfully to', mobile);
//       return true;
//     } else {
//       console.error(':x: Failed to send OTP:', response.data);
//       return false;
//     }
//   } catch (err) {
//     console.error(':x: Error sending OTP via 2Factor:', err.message);
//     if (err.response) {
//       console.error(':x: Response status:', err.response.status);
//       console.error(':x: Response data:', err.response.data);
//     }
//     return false;
//   }
// };

// module.exports = otpService;

// //  https://sms.mobileadz.in/api/push.json?apikey=5bae274c5afc8&route=trans_dnd&sender=FLASHB&mobileno=8460827893&text=Your%20OTP%20for%20123%20is%201234.%20This%20password%20would%20be%20valid%20for%205%20minutes%20only.%0AFLASHB

const axios = require('axios');
const OTP = require("../models/Otp")
class otpService {
    constructor() {
        // SMS Provider Configuration
        this.smsApiKey = process.env.SMS_API_KEY;
        this.smsSender = process.env.SMS_SENDER;
        this.smsRoute = process.env.SMS_ROUTE;
        this.smsBaseUrl = process.env.SMS_BASE_URL;

        this.appHash = process.env.APP_HASH || '';
        this.appName = process.env.APP_NAME || 'waploy';


        // OTP Configuration
        this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
        this.bypassOTP = process.env.BYPASS_OTP || '2345';

        // Load bypass numbers
        this.bypassNumbers = [];
        if (process.env.BYPASS_NUMBERS) {
            try {
                this.bypassNumbers = process.env.BYPASS_NUMBERS.split(',')
                    .map(num => num.trim())
                    .filter(num => num.length > 0);
            } catch (error) {
                console.error('Error parsing BYPASS_NUMBERS:', error);
            }
        }
    }

    _isNumberInBypassList(mobileNo) {
        const normalizedNumber = mobileNo.toString().trim();
        return this.bypassNumbers.includes(normalizedNumber);
    }

    async _sendSMS(mobileNo, otpValue, customMessage = null) {
        let hashSuffix = this.appHash;
        if (!hashSuffix) {
            hashSuffix = 'ABC123XYZW9'; // Example fallback
        }
        
        // Use custom message if provided, otherwise use default
        // Replace {OTP} placeholder with actual OTP value if present
        let message = customMessage || `Your OTP for ${this.appName} is ${otpValue}. This password would be valid for 5 minutes only.\nFLASHB`;
        if (customMessage && customMessage.includes('{OTP}')) {
            message = customMessage.replace('{OTP}', otpValue);
        }
        
        // Ensure message ends with \nFLASHB as per API format (exactly as in example)
        // Example format: "Your OTP for 123 is 1234. This password would be valid for 5 minutes only.\nFLASHB"
        if (!message.endsWith('\nFLASHB')) {
            message = message.trim() + '\nFLASHB';
        }
        
       
        const encodedMessage = encodeURIComponent(message);
       
        const url = `${this.smsBaseUrl}?apikey=${this.smsApiKey}&route=${this.smsRoute}&sender=${this.smsSender}&mobileno=${mobileNo}&text=${encodedMessage}`;

        try {
            const response = await axios.get(url);
            if (response.data && (
                response.data.status === 'success' || 
                response.data.Status === 'Success' ||
                response.data.status === 'Success' ||
                (response.data.response && response.data.response.status === 'success')
            )) {
                return {
                    success: true,
                    message: 'SMS sent successfully',
                    data: response.data
                };
            } else {
                // Log the actual response for debugging
                console.error('SMS API Error Response:', JSON.stringify(response.data, null, 2));
                const errorMsg = response.data?.message || response.data?.error || response.data?.Response || 'Failed to send SMS';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Error sending SMS:', error);
            // If it's an axios error with response data, include that in the error message
            if (error.response && error.response.data) {
                console.error('SMS API Error Details:', JSON.stringify(error.response.data, null, 2));
                const errorMsg = error.response.data.message || error.response.data.error || error.response.data.Response || error.message;
                throw new Error(`Failed to send SMS: ${errorMsg}`);
            }
            throw new Error(`Failed to send SMS: ${error.message}`);
        }
    }

    async sendOTP(mobileNo, name, customMessage = null) {
        try {
            const normalizedMobileNo = mobileNo.toString().trim();

            // Check if number is in bypass list
            if (this._isNumberInBypassList(normalizedMobileNo)) {
                // Delete any existing unused OTPs for this number
                await OTP.deleteMany({
                    mobileNo: normalizedMobileNo,
                    name: name,
                    isUsed: false,
                    expiresAt: { $gt: new Date() }
                });

                const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60000);
                const sessionId = `BYPASS-${Date.now()}`;

                await OTP.create({
                    mobileNo: normalizedMobileNo,
                    name,
                    sessionId,
                    expiresAt
                });

                return {
                    success: true,
                    message: 'OTP bypass enabled for this number',
                    data: {
                        sessionId,
                        expiresAt
                    }
                };
            }

            // Delete existing unused OTPs
            await OTP.deleteMany({
                mobileNo: normalizedMobileNo,
                isUsed: false,
                name: name,
                expiresAt: { $gt: new Date() }
            });


            // Generate 6-digit OTP (100000 to 999999)
            const otpValue = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60000);
            const sessionId = `SMS-${Date.now()}`;

            let otpRecord = await OTP.create({
                mobileNo: normalizedMobileNo,
                sessionId,
                otp: otpValue,
                name: name || "",
                isSent: false,
                expiresAt,
                createdAt: new Date()
            });


            const smsResult = await this._sendSMS(normalizedMobileNo, otpValue, customMessage);

            if (smsResult.success) {


                otpRecord.isSent = true;
                await otpRecord.save();


                return {
                    success: true,
                    message: 'OTP sent successfully',
                    data: {
                        sessionId,
                        expiresAt,
                        otp: otpValue // Include OTP value in response
                    }
                };
            } else {
                throw new Error(smsResult.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            throw new Error(`Failed to send OTP: ${error.message}`);
        }
    }

    async verifyOTP(mobileNo, otpCode) {
        try {
            const normalizedMobileNo = mobileNo.toString().trim();
            const normalizedOTPCode = otpCode.toString().trim();

            const otpRecord = await OTP.findOne({
                mobileNo: normalizedMobileNo,
                isUsed: false,
                expiresAt: { $gt: new Date() }
            }).sort({ createdAt: -1 });

            if (!otpRecord) {
                return {
                    success: false,
                    message: 'OTP expired or not found'
                };
            }

            const currentTime = new Date();
            const isExpired = otpRecord.expiresAt <= currentTime;

            if (isExpired) {
                return {
                    success: false,
                    message: 'OTP has expired'
                };
            }

            // Bypass OTP verification
            if (otpRecord.sessionId.startsWith('BYPASS-')) {

                if (normalizedOTPCode === this.bypassOTP) {
                    otpRecord.isUsed = true;
                    await otpRecord.save();
                    return {
                        success: true,
                        message: 'OTP bypass verification successful'
                    };
                } else {
                    return {
                        success: false,
                        message: 'Invalid bypass OTP'
                    };
                }
            }

            // Normal OTP verification
            if (otpRecord.otp === normalizedOTPCode) {
                otpRecord.isUsed = true;
                await otpRecord.save();
                return {
                    success: true,
                    message: 'OTP verified successfully'
                };
            } else {
                return {
                    success: false,
                    message: 'Invalid OTP'
                };
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return {
                success: false,
                message: 'Invalid or mismatch OTP'
            };
        }
    }

    async resendOTP(mobileNo) {
        try {
            const normalizedMobileNo = mobileNo.toString().trim();

            const deleteResult = await OTP.deleteMany({
                mobileNo: normalizedMobileNo,
                isUsed: false,
                expiresAt: { $gt: new Date() }
            });
            return this.sendOTP(normalizedMobileNo);
        } catch (error) {
            console.error('Error resending OTP:', error);
            throw new Error('Failed to resend OTP');
        }
    }
}

module.exports = otpService;