import 'package:flutter/material.dart';
import 'notifications_page.dart';
import 'service_details_page.dart';
import 'profile_page.dart';
void main() {
  runApp(const MediConnectApp());
}

class MediConnectApp extends StatelessWidget {
  const MediConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MediConnect',
      theme: ThemeData(
        primarySwatch: Colors.green,
        scaffoldBackgroundColor: Colors.white,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedCity = 'Mumbai';
  List<String> cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];

  final List<Map<String, dynamic>> allServices = [
    {
      'title': 'General Physician',
      'icon': Icons.medical_services,
      'doctors': 45,
      'startingPrice': '₹499',
      'rating': 4.5,
      'categories': ['Consultation', 'Prescription', 'Follow-up'],
    },
    {
      'title': 'Mental Health',
      'icon': Icons.psychology,
      'doctors': 38,
      'startingPrice': '₹799',
      'rating': 4.3,
      'categories': ['Therapy', 'Counseling', 'Support Groups'],
    },
    {
      'title': 'Pediatrics',
      'icon': Icons.child_care,
      'doctors': 62,
      'startingPrice': '₹599',
      'rating': 4.7,
      'categories': ['Child Care', 'Vaccination', 'Development'],
    },
    {
      'title': 'Cardiology',
      'icon': Icons.favorite,
      'doctors': 33,
      'startingPrice': '₹999',
      'rating': 4.4,
      'categories': ['Heart Health', 'ECG', 'Consultation'],
    },
    {
      'title': 'Dermatology',
      'icon': Icons.face,
      'doctors': 28,
      'startingPrice': '₹699',
      'rating': 4.2,
      'categories': ['Skin Care', 'Treatment', 'Consultation'],
    },
    {
      'title': 'Emergency Care',
      'icon': Icons.emergency,
      'doctors': 41,
      'startingPrice': '₹1999',
      'rating': 4.6,
      'categories': ['24/7 Support', 'Ambulance', 'Critical Care'],
    },
  ];

  final List<Map<String, dynamic>> communityPosts = [
    {
      'author': 'Dr. Rajesh Kumar',
      'title': 'Understanding COVID-19 Vaccination',
      'likes': 256,
      'comments': 43,
    },
    {
      'author': 'Dr. Priya Sharma',
      'title': 'Mental Health During Pandemic',
      'likes': 342,
      'comments': 58,
    },
  ];

  List<Map<String, dynamic>> get filteredServices {
    return allServices.where((service) {
      final titleMatch = service['title'].toString().toLowerCase().contains(_searchQuery.toLowerCase());
      final categoryMatch = service['categories'].any((category) => 
        category.toString().toLowerCase().contains(_searchQuery.toLowerCase()));
      return titleMatch || categoryMatch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        title: ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [Color(0xFF8BC34A), Color(0xFF4CAF50)],
          ).createShader(bounds),
          child: const Text(
            'MediConnect',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications, color: Color(0xFF8BC34A)),
            onPressed: () {
              Navigator.push(
                context, 
                MaterialPageRoute(builder: (context) => NotificationsPage()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.person, color: Color(0xFF8BC34A)),
            onPressed: () {
              Navigator.push(
                context, 
                MaterialPageRoute(builder: (context) =>const UserProfilePage()),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DropdownButtonFormField<String>(
                value: _selectedCity,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.location_city, color: Color(0xFF8BC34A)),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                ),
                items: cities.map((String city) {
                  return DropdownMenuItem(
                    value: city,
                    child: Text(city),
                  );
                }).toList(),
                onChanged: (String? newValue) {
                  setState(() {
                    _selectedCity = newValue!;
                  });
                },
              ),
              const SizedBox(height: 16),

              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(30),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.grey.withOpacity(0.2),
                      spreadRadius: 2,
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                  decoration: InputDecoration(
                    hintText: 'Search for healthcare services...',
                    prefixIcon: const Icon(Icons.search, color: Color(0xFF8BC34A)),
                    suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            setState(() {
                              _searchController.clear();
                              _searchQuery = '';
                            });
                          },
                        )
                      : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Available Specialists',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      foreground: Paint()
                        ..shader = const LinearGradient(
                          colors: [Color(0xFF8BC34A), Color(0xFF4CAF50)],
                        ).createShader(const Rect.fromLTWH(0.0, 0.0, 200.0, 70.0)),
                    ),
                  ),
                  Text(
                    '${filteredServices.length} specialists found',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.8,
                ),
                itemCount: filteredServices.length,
                itemBuilder: (context, index) {
                  final service = filteredServices[index];
                  return Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context, 
                          MaterialPageRoute(
                            builder: (context) => ServiceDetailsPage(service: service),
                          ),
                        );
                      },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            service['icon'],
                            size: 40,
                            color: const Color(0xFF8BC34A),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            service['title'],
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          Text(
                            'From ${service['startingPrice']}',
                            style: TextStyle(
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.star, color: Colors.amber, size: 16),
                              Text(' ${service['rating']}'),
                            ],
                          ),
                          Text(
                            '${service['doctors']} doctors',
                            style: TextStyle(
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),

              const SizedBox(height: 24),
              Text(
                'Health Forum',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  foreground: Paint()
                    ..shader = const LinearGradient(
                      colors: [Color(0xFF8BC34A), Color(0xFF4CAF50)],
                    ).createShader(const Rect.fromLTWH(0.0, 0.0, 200.0, 70.0)),
                ),
              ),
              const SizedBox(height: 16),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: communityPosts.length,
                itemBuilder: (context, index) {
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),
                      title: Text(
                        communityPosts[index]['title'],
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),
                          Text(
                            'Posted by ${communityPosts[index]['author']}',
                            style: TextStyle(color: Colors.grey[600]),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.thumb_up, size: 16, color: Colors.grey[600]),
                              const SizedBox(width: 4),
                              Text('${communityPosts[index]['likes']}'),
                              const SizedBox(width: 16),
                              Icon(Icons.comment, size: 16, color: Colors.grey[600]),
                              const SizedBox(width: 4),
                              Text('${communityPosts[index]['comments']}'),
                            ],
                          ),
                        ],
                      ),
                      onTap: () {},
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: const Color(0xFF8BC34A),
        child: const Icon(Icons.add),
      ),
    );
  }
}