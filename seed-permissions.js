/**
 * Seed Permissions Script
 * 
 * This script populates the database with sample permissions matching
 * the structure from your sample data.
 * 
 * Usage:
 *   node seed-permissions.js
 * 
 * Note: This will clear existing permissions and create new ones.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('./models/Permission');

// Sample permissions data
const samplePermissions = [
  {
    name: 'settings',
    sub_permissions: [
      {
        name: 'Permissions',
        sub_permissions: [
          { name: 'add permissions', sub_permissions: null },
          { name: 'edit permissions', sub_permissions: null },
          { name: 'delete permissions', sub_permissions: null },
          { name: 'View Permissions', sub_permissions: null }
        ]
      },
      {
        name: 'Roles',
        sub_permissions: [
          { name: 'Add Role', sub_permissions: null },
          { name: 'Edit Role', sub_permissions: null },
          { name: 'Delete Role', sub_permissions: null },
          { name: 'manage permissions', sub_permissions: null },
          { name: 'View Roles', sub_permissions: null }
        ]
      },
      {
        name: 'merchants',
        sub_permissions: [
          { name: 'Add Merchant', sub_permissions: null },
          { name: 'Delete Merchant', sub_permissions: null },
          { name: 'Edit Mechant', sub_permissions: null },
          { name: 'View Merchants', sub_permissions: null }
        ]
      },
      {
        name: 'CDN',
        sub_permissions: [
          { name: 'View CDN', sub_permissions: null },
          { name: 'Add CDN', sub_permissions: null },
          { name: 'Delete CDN', sub_permissions: null }
        ]
      },
      {
        name: 'Users',
        sub_permissions: [
          { name: 'View Users', sub_permissions: null },
          { name: 'Add User', sub_permissions: null },
          { name: 'Edit User', sub_permissions: null },
          { name: 'Change Password', sub_permissions: null }
        ]
      },
      {
        name: 'Template Categories',
        sub_permissions: [
          { name: 'add template category', sub_permissions: null },
          { name: 'edit template category', sub_permissions: null },
          { name: 'delete template category', sub_permissions: null },
          { name: 'view template categories', sub_permissions: null }
        ]
      }
    ]
  },
  {
    name: 'domains',
    sub_permissions: [
      {
        name: 'buy type',
        sub_permissions: [
          { name: 'add buy type', sub_permissions: null },
          { name: 'delete buy type', sub_permissions: null },
          { name: 'edit buy type', sub_permissions: null },
          { name: 'view buy types', sub_permissions: null }
        ]
      },
      {
        name: 'associations',
        sub_permissions: [
          { name: 'add association', sub_permissions: null },
          { name: 'delete association', sub_permissions: null },
          { name: 'edit association', sub_permissions: null },
          { name: 'view associations', sub_permissions: null }
        ]
      },
      {
        name: 'niche',
        sub_permissions: [
          { name: 'add niche', sub_permissions: null },
          { name: 'delete niche', sub_permissions: null },
          { name: 'edit niche', sub_permissions: null },
          { name: 'view niches', sub_permissions: null }
        ]
      },
      {
        name: 'domain status',
        sub_permissions: [
          { name: 'add domain status', sub_permissions: null },
          { name: 'delete domain status', sub_permissions: null },
          { name: 'edit domain status', sub_permissions: null },
          { name: 'view domain status', sub_permissions: null }
        ]
      },
      {
        name: 'My Domains',
        sub_permissions: [
          { name: 'add domain', sub_permissions: null },
          { name: 'delete domain', sub_permissions: null },
          { name: 'edit domain', sub_permissions: null },
          { name: 'View Domains', sub_permissions: null },
          { name: 'transfer domains', sub_permissions: null },
          { name: 'View Backlink Report', sub_permissions: null }
        ]
      },
      {
        name: 'Registrar',
        sub_permissions: [
          { name: 'add registrar', sub_permissions: null },
          { name: 'delete registrar', sub_permissions: null },
          { name: 'edit registrar', sub_permissions: null },
          { name: 'View registrars', sub_permissions: null }
        ]
      },
      {
        name: 'Hosting Provider',
        sub_permissions: [
          { name: 'add hosting provider', sub_permissions: null },
          { name: 'edit hosting provider', sub_permissions: null },
          { name: 'delete hosting provider', sub_permissions: null },
          { name: 'view hosting providers', sub_permissions: null }
        ]
      },
      {
        name: 'transfer domains',
        sub_permissions: null
      },
      {
        name: 'upload excel',
        sub_permissions: null
      }
    ]
  },
  {
    name: 'templates',
    sub_permissions: [
      { name: 'add template', sub_permissions: null },
      { name: 'edit template', sub_permissions: null },
      { name: 'View Templates', sub_permissions: null },
      {
        name: 'article categories',
        sub_permissions: [
          { name: 'add article category', sub_permissions: null },
          { name: 'edit article category', sub_permissions: null },
          { name: 'delete article category', sub_permissions: null },
          { name: 'view article categories', sub_permissions: null }
        ]
      },
      {
        name: 'template articles',
        sub_permissions: [
          { name: 'add template article', sub_permissions: null },
          { name: 'edit template article', sub_permissions: null },
          { name: 'delete template article', sub_permissions: null },
          { name: 'view template articles', sub_permissions: null }
        ]
      },
      { name: 'delete template', sub_permissions: null },
      { name: 'template tag manager', sub_permissions: null },
      { name: 'template seo', sub_permissions: null },
      { name: 'deploy template', sub_permissions: null },
      { name: 'template media', sub_permissions: null }
    ]
  },
  {
    name: 'reports',
    sub_permissions: []
  },
  {
    name: 'projects',
    sub_permissions: [
      { name: 'view projects', sub_permissions: null },
      { name: 'add project', sub_permissions: null },
      {
        name: 'manage project',
        sub_permissions: [
          { name: 'project tag manager', sub_permissions: null },
          { name: 'project seo', sub_permissions: null },
          { name: 'customize project', sub_permissions: null }
        ]
      },
      {
        name: 'manage domain',
        sub_permissions: [
          { name: 'connect domain', sub_permissions: null },
          { name: 'disconnect domain', sub_permissions: null }
        ]
      },
      {
        name: 'project articles',
        sub_permissions: [
          { name: 'Add Project Article', sub_permissions: null },
          { name: 'Edit Project Article', sub_permissions: null },
          { name: 'Delete Project Article', sub_permissions: null },
          { name: 'View Project Articles', sub_permissions: null }
        ]
      },
      {
        name: 'Project Categories',
        sub_permissions: [
          { name: 'Add Project Category', sub_permissions: null },
          { name: 'Edit Project Category', sub_permissions: null },
          { name: 'Delete Project Category', sub_permissions: null },
          { name: 'View Project Categories', sub_permissions: null }
        ]
      },
      { name: 'delete project', sub_permissions: null },
      { name: 'deploy project', sub_permissions: null },
      { name: 'transfer projects', sub_permissions: null },
      {
        name: 'Project layout',
        sub_permissions: [
          { name: 'view layout', sub_permissions: null },
          { name: 'add section', sub_permissions: null },
          { name: 'edit section', sub_permissions: null },
          { name: 'delete section', sub_permissions: null },
          { name: 'disable section', sub_permissions: null },
          { name: 'add page', sub_permissions: null },
          { name: 'edit page', sub_permissions: null },
          { name: 'delete page', sub_permissions: null },
          { name: 'disable page', sub_permissions: null },
          { name: 'add widget', sub_permissions: null },
          { name: 'delete widget', sub_permissions: null },
          { name: 'disable widget', sub_permissions: null },
          { name: 'edit widget', sub_permissions: null }
        ]
      },
      {
        name: 'gallery',
        sub_permissions: [
          { name: 'add image', sub_permissions: null },
          { name: 'delete image', sub_permissions: null },
          { name: 'view images', sub_permissions: null }
        ]
      },
      { name: 'ai manager', sub_permissions: null },
      { name: 'manage users', sub_permissions: null }
    ]
  }
];

async function seedPermissions() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing permissions
    console.log('\nClearing existing permissions...');
    const deleteResult = await Permission.deleteMany({});
    console.log(`✓ Deleted ${deleteResult.deletedCount} existing permissions`);

    // Insert sample permissions
    console.log('\nInserting sample permissions...');
    const created = await Permission.insertMany(samplePermissions);
    console.log(`✓ Created ${created.length} permissions`);

    // Display created permissions
    console.log('\n📋 Created Permissions:');
    created.forEach((perm, index) => {
      console.log(`\n${index + 1}. ${perm.name} (ID: ${perm._id})`);
      if (perm.sub_permissions && perm.sub_permissions.length > 0) {
        console.log(`   └─ ${perm.sub_permissions.length} sub-permissions`);
        perm.sub_permissions.forEach(sub => {
          const nestedCount = sub.sub_permissions 
            ? ` (${sub.sub_permissions.length} nested)` 
            : '';
          console.log(`      • ${sub.name}${nestedCount}`);
        });
      }
    });

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your server: node server.js');
    console.log('   2. Login to get a JWT token');
    console.log('   3. Test the API: GET http://localhost:5000/api/permissions');
    console.log('   4. Check PERMISSIONS_API.md for complete documentation');

  } catch (error) {
    console.error('\n❌ Error seeding permissions:', error.message);
    if (error.errors) {
      console.error('\nValidation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the seeding function
seedPermissions();

