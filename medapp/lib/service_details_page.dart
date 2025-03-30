import 'package:flutter/material.dart';

class ServiceDetailsPage extends StatefulWidget {
  final Map<String, dynamic> service;

  const ServiceDetailsPage({super.key, required this.service});

  @override
  State<ServiceDetailsPage> createState() => _ServiceDetailsPageState();
}

class _ServiceDetailsPageState extends State<ServiceDetailsPage> {
  final List<Map<String, dynamic>> availableDoctors = [
    {
      'name': 'Dr. Sarah Johnson',
      'experience': '12 years',
      'rating': 4.8,
      'specialization': 'General Medicine',
      'price': '₹899',
      'avatar': Icons.person,
    },
    {
      'name': 'Dr. Ravi Mehta',
      'experience': '15 years',
      'rating': 4.9,
      'specialization': 'Cardiology',
      'price': '₹1299',
      'avatar': Icons.person_outline,
    },
    {
      'name': 'Dr. Priya Sharma',
      'experience': '8 years',
      'rating': 4.7,
      'specialization': 'Pediatrics',
      'price': '₹799',
      'avatar': Icons.face,
    },
  ];

  // Define our medical app's theme colors
  final Color primaryGreen = const Color(0xFF4CAF50);
  final Color lightGreen = const Color(0xFFAED581);
  final Color darkGreen = const Color(0xFF388E3C);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: primaryGreen),
          onPressed: () => Navigator.pop(context),
        ),
        title: ShaderMask(
          shaderCallback: (bounds) => LinearGradient(
            colors: [lightGreen, darkGreen],
          ).createShader(bounds),
          child: Text(
            widget.service['title'],
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Service Overview Card
              Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(15),
                ),
                elevation: 4,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(15),
                    gradient: LinearGradient(
                      colors: [Colors.white, lightGreen.withOpacity(0.1)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Icon(
                        widget.service['icon'],
                        size: 60,
                        color: primaryGreen,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        widget.service['title'],
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Consultation fee from ${widget.service['startingPrice']}',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Column(
                            children: [
                              Icon(Icons.medical_services, color: primaryGreen),
                              Text('${widget.service['doctors']} Doctors'),
                            ],
                          ),
                          Column(
                            children: [
                              const Icon(Icons.star, color: Colors.amber),
                              Text('${widget.service['rating']} Rating'),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Available Services
              Text(
                'Services Offered',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  foreground: Paint()
                    ..shader = LinearGradient(
                      colors: [primaryGreen, darkGreen],
                    ).createShader(const Rect.fromLTWH(0.0, 0.0, 200.0, 70.0)),
                ),
              ),
              const SizedBox(height: 16),
              Column(
                children: List.generate(
                  widget.service['categories'].length,
                  (index) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: ListTile(
                      leading: Icon(Icons.check_circle, color: primaryGreen),
                      title: Text(widget.service['categories'][index]),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Available Doctors
              Text(
                'Available Doctors',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  foreground: Paint()
                    ..shader = LinearGradient(
                      colors: [primaryGreen, darkGreen],
                    ).createShader(const Rect.fromLTWH(0.0, 0.0, 200.0, 70.0)),
                ),
              ),
              const SizedBox(height: 16),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: availableDoctors.length,
                itemBuilder: (context, index) {
                  final doctor = availableDoctors[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: lightGreen.withOpacity(0.2),
                        child: Icon(doctor['avatar'], color: primaryGreen),
                      ),
                      title: Text(
                        doctor['name'],
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Experience: ${doctor["experience"]}'),
                          Text('Specialization: ${doctor["specialization"]}'),
                          Row(
                            children: [
                              const Icon(Icons.star, color: Colors.amber, size: 16),
                              Text(' ${doctor["rating"]}'),
                            ],
                          ),
                        ],
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            doctor['price'],
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: primaryGreen,
                            ),
                          ),
                          const Text('Per Visit'),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Book appointment logic
        },
        backgroundColor: primaryGreen,
        label: const Text('Book Appointment'),
        icon: const Icon(Icons.calendar_today),
      ),
    );
  }
}