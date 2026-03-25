import 'package:json_annotation/json_annotation.dart';

part 'event_model.g.dart';

@JsonSerializable()
class EventModel {
  final String id;
  final String title;
  final String description;
  final List<String> banners;
  final List<CategoryModel> categories;
  final List<SlotModel> slots;
  final List<TicketTypeModel> ticketTypes;
  final int duration;
  final AddressModel address;
  final OrganizerModel organizer;
  final String? termsAndConditions;
  final String status;
  final bool isFeatured;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.banners,
    required this.categories,
    required this.slots,
    required this.ticketTypes,
    required this.duration,
    required this.address,
    required this.organizer,
    this.termsAndConditions,
    required this.status,
    required this.isFeatured,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) =>
      _$EventModelFromJson(json);

  Map<String, dynamic> toJson() => _$EventModelToJson(this);
}

@JsonSerializable()
class CategoryModel {
  final String id;
  final String name;
  final String? description;
  final String? image;

  CategoryModel({
    required this.id,
    required this.name,
    this.description,
    this.image,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) =>
      _$CategoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$CategoryModelToJson(this);
}

@JsonSerializable()
class SlotModel {
  final String id;
  final DateTime date;
  final String startTime;
  final String endTime;

  SlotModel({
    required this.id,
    required this.date,
    required this.startTime,
    required this.endTime,
  });

  factory SlotModel.fromJson(Map<String, dynamic> json) =>
      _$SlotModelFromJson(json);

  Map<String, dynamic> toJson() => _$SlotModelToJson(this);
}

@JsonSerializable()
class TicketTypeModel {
  final String id;
  final String title;
  final double price;
  final int totalQuantity;
  final int availableQuantity;

  TicketTypeModel({
    required this.id,
    required this.title,
    required this.price,
    required this.totalQuantity,
    required this.availableQuantity,
  });

  factory TicketTypeModel.fromJson(Map<String, dynamic> json) =>
      _$TicketTypeModelFromJson(json);

  Map<String, dynamic> toJson() => _$TicketTypeModelToJson(this);
}

@JsonSerializable()
class AddressModel {
  final String fullAddress;
  final String city;
  final String state;
  final String pincode;
  final double? latitude;
  final double? longitude;

  AddressModel({
    required this.fullAddress,
    required this.city,
    required this.state,
    required this.pincode,
    this.latitude,
    this.longitude,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) =>
      _$AddressModelFromJson(json);

  Map<String, dynamic> toJson() => _$AddressModelToJson(this);
}

@JsonSerializable()
class OrganizerModel {
  final String organizerId;
  final String name;
  final String contactInfo;

  OrganizerModel({
    required this.organizerId,
    required this.name,
    required this.contactInfo,
  });

  factory OrganizerModel.fromJson(Map<String, dynamic> json) =>
      _$OrganizerModelFromJson(json);

  Map<String, dynamic> toJson() => _$OrganizerModelToJson(this);
}

