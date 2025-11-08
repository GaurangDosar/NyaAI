-- Query to check what's in user_roles table
SELECT 
  ur.user_id,
  ur.role,
  p.name,
  p.email,
  ur.created_at
FROM user_roles ur
LEFT JOIN profiles p ON p.user_id = ur.user_id
ORDER BY ur.created_at DESC;

-- Count by role
SELECT 
  role,
  COUNT(*) as count
FROM user_roles
GROUP BY role;

-- Check for users without a role
SELECT 
  p.user_id,
  p.name,
  p.email
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
);

-- Check for lawyers
SELECT 
  ur.user_id,
  ur.role,
  p.name,
  p.email,
  lp.specialization,
  lp.experience_years
FROM user_roles ur
LEFT JOIN profiles p ON p.user_id = ur.user_id
LEFT JOIN lawyer_profiles lp ON lp.user_id = ur.user_id
WHERE ur.role = 'lawyer';

-- Check for regular users
SELECT 
  ur.user_id,
  ur.role,
  p.name,
  p.email
FROM user_roles ur
LEFT JOIN profiles p ON p.user_id = ur.user_id
WHERE ur.role = 'user';
