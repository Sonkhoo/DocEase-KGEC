import 'package:flutter/material.dart';

class UserProfilePage extends StatelessWidget {
  // Define our medical app's theme colors
  final Color primaryGreen = const Color(0xFF4CAF50);
  final Color lightGreen = const Color(0xFFAED581);
  final Color darkGreen = const Color(0xFF388E3C);

  const UserProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: primaryGreen),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'My Profile',
          style: TextStyle(
            color: darkGreen,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.edit, color: primaryGreen),
            onPressed: () {
              // Edit profile logic
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Profile Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(30),
                  bottomRight: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    spreadRadius: 1,
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: lightGreen,
                    child: const Icon(
                      Icons.person,
                      size: 50,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Sarah Johnson',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Patient ID: MED-2024-001',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildInfoChip(Icons.calendar_today, '32 years'),
                      _buildInfoChip(Icons.bloodtype, 'B+'),
                      _buildInfoChip(Icons.height, '165 cm'),
                      _buildInfoChip(Icons.monitor_weight, '62 kg'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Medical Information
            _buildSection(
              'Medical Information',
              [
                _buildInfoTile(
                  'Allergies',
                  'Penicillin, Peanuts',
                  Icons.warning,
                  Colors.red,
                ),
                _buildInfoTile(
                  'Chronic Conditions',
                  'Asthma',
                  Icons.medical_services,
                  primaryGreen,
                ),
                _buildInfoTile(
                  'Current Medications',
                  'Ventolin Inhaler',
                  Icons.medication,
                  Colors.blue,
                ),
              ],
            ),

            // Personal Information
            _buildSection(
              'Personal Information',
              [
                _buildInfoTile(
                  'Phone',
                  '+91 98765 43210',
                  Icons.phone,
                  primaryGreen,
                ),
                _buildInfoTile(
                  'Email',
                  'sarah.j@email.com',
                  Icons.email,
                  primaryGreen,
                ),
                _buildInfoTile(
                  'Address',
                  '123 Health Street, Medical District',
                  Icons.location_on,
                  primaryGreen,
                ),
              ],
            ),

            // Emergency Contacts
            _buildSection(
              'Emergency Contacts',
              [
                _buildInfoTile(
                  'John Johnson (Spouse)',
                  '+91 98765 43211',
                  Icons.contact_phone,
                  Colors.orange,
                ),
                _buildInfoTile(
                  'Mary Johnson (Mother)',
                  '+91 98765 43212',
                  Icons.contact_phone,
                  Colors.orange,
                ),
              ],
            ),

            // Recent Activity
            _buildSection(
              'Recent Activity',
              [
                _buildActivityTile(
                  'General Checkup',
                  'Dr. Ravi Mehta',
                  '15 Feb 2024',
                ),
                _buildActivityTile(
                  'Blood Test',
                  'City Medical Lab',
                  '10 Feb 2024',
                ),
                _buildActivityTile(
                  'Vaccination',
                  'Dr. Priya Sharma',
                  '01 Feb 2024',
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Book new appointment logic
        },
        backgroundColor: primaryGreen,
        label: const Text('Book Appointment'),
        icon: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: lightGreen.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: primaryGreen),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              color: darkGreen,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: darkGreen,
              ),
            ),
          ),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoTile(
    String title,
    String subtitle,
    IconData icon,
    Color iconColor,
  ) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: iconColor.withOpacity(0.1),
        child: Icon(icon, color: iconColor),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(subtitle),
    );
  }

  Widget _buildActivityTile(String title, String doctor, String date) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: primaryGreen.withOpacity(0.1),
        child: Icon(Icons.calendar_today, color: primaryGreen),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text('$doctor\n$date'),
      isThreeLine: true,
    );
  }
}