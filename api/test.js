// 最简单的测试API
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
};
