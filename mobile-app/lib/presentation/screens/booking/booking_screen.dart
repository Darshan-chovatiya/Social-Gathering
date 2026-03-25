import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class BookingScreen extends ConsumerWidget {
  final String eventId;
  final String slotId;

  const BookingScreen({
    super.key,
    required this.eventId,
    required this.slotId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Tickets')),
      body: const Center(
        child: Text('Booking screen - Coming soon'),
      ),
    );
  }
}

