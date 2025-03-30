import 'package:flutter/material.dart';

class NotificationsPage extends StatelessWidget {
  final List<Map<String, dynamic>> notifications = [
    {
      'title': 'Appointment Confirmed',
      'subtitle': 'Your consultation with Dr. Sharma is scheduled for tomorrow',
      'time': '2 hours ago',
      'icon': Icons.check_circle,
      'color': const Color(0xFF4CAF50),
    },
    {
      'title': 'New Specialist Available',
      'subtitle': 'Dr. Patel - Cardiologist now available for consultations',
      'time': '5 hours ago',
      'icon': Icons.medical_services,
      'color': const Color(0xFF8BC34A),
    },
    {
      'title': 'Payment Reminder',
      'subtitle': 'Consultation payment pending for Dr. Kumar',
      'time': '1 day ago',
      'icon': Icons.payment,
      'color': Colors.blue,
    },
    {
      'title': 'Health Forum Update',
      'subtitle': 'Dr. Mehta replied to your question about vaccination',
      'time': '2 days ago',
      'icon': Icons.forum,
      'color': const Color(0xFF8BC34A),
    },
    {
      'title': 'Prescription Ready',
      'subtitle': 'Your digital prescription has been uploaded',
      'time': '3 days ago',
      'icon': Icons.description,
      'color': const Color(0xFF4CAF50),
    },
    {
      'title': 'Appointment Rescheduled',
      'subtitle': 'Your appointment with Dr. Singh has been moved to Friday',
      'time': '4 days ago',
      'icon': Icons.event_busy,
      'color': Colors.orange,
    },
    {
      'title': 'Lab Results Available',
      'subtitle': 'Your recent blood test results are ready to view',
      'time': '4 days ago',
      'icon': Icons.science,
      'color': const Color(0xFF8BC34A),
    },
    {
      'title': 'Medicine Reminder',
      'subtitle': 'Time to take your evening medication',
      'time': '5 days ago',
      'icon': Icons.medication,
      'color': const Color(0xFF4CAF50),
    },
  ];

  NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF8BC34A)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [Color(0xFF8BC34A), Color(0xFF4CAF50)],
          ).createShader(bounds),
          child: const Text(
            'Notifications',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.clear_all, color: Color(0xFF8BC34A)),
            onPressed: () {
              showDialog(
                context: context,
                builder: (BuildContext context) {
                  return AlertDialog(
                    title: const Text('Clear All Notifications'),
                    content: const Text('Are you sure you want to clear all notifications?'),
                    actions: [
                      TextButton(
                        child: const Text('Cancel'),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                      TextButton(
                        child: const Text(
                          'Clear All',
                          style: TextStyle(color: Color(0xFF4CAF50)),
                        ),
                        onPressed: () {
                          // Add clear notifications logic here
                          Navigator.of(context).pop();
                        },
                      ),
                    ],
                  );
                },
              );
            },
          ),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_off,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No notifications',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return Dismissible(
                  key: Key(notification['title']),
                  background: Container(
                    decoration: BoxDecoration(
                      color: Colors.red.shade100,
                      borderRadius: BorderRadius.circular(15),
                    ),
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    child: const Icon(
                      Icons.delete,
                      color: Colors.red,
                    ),
                  ),
                  direction: DismissDirection.endToStart,
                  onDismissed: (direction) {
                    // Add delete notification logic here
                  },
                  child: Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: notification['color'].withOpacity(0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          notification['icon'],
                          color: notification['color'],
                        ),
                      ),
                      title: Text(
                        notification['title'],
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 4),
                          Text(
                            notification['subtitle'],
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            notification['time'],
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      trailing: PopupMenuButton(
                        icon: const Icon(Icons.more_vert),
                        itemBuilder: (context) => [
                          const PopupMenuItem(
                            value: 'mark_read',
                            child: Row(
                              children: [
                                Icon(Icons.check_circle_outline),
                                SizedBox(width: 8),
                                Text('Mark as read'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete_outline),
                                SizedBox(width: 8),
                                Text('Delete'),
                              ],
                            ),
                          ),
                        ],
                        onSelected: (value) {
                          // Add action handling logic here
                        },
                      ),
                      onTap: () {
                        // Add notification tap handling logic here
                      },
                    ),
                  ),
                );
              },
            ),
    );
  }
}