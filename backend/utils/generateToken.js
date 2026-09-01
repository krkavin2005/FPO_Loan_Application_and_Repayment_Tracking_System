import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'agrilend360_super_secure_jwt_token_secret_9988776655', {
    expiresIn: '30d',
  });
};

export default generateToken;
