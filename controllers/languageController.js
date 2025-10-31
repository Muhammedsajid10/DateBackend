const User = require('../models/userModel');

exports.updateLanguage = async (req, res) => {
  const { mobileNumber, language } = req.body;     
  try {
    const user = await User.findOneAndUpdate(
      { mobileNumber },
      { language },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'Language updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating language', error: err.message });
  }
}; 