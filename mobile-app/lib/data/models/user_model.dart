import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

@JsonSerializable()
class UserModel {
  final String id;
  final String name;
  final String mobile;
  final String? email;
  final String role;
  final bool isMobileVerified;
  final String? profilePicture;
  final bool isActive;

  UserModel({
    required this.id,
    required this.name,
    required this.mobile,
    this.email,
    required this.role,
    required this.isMobileVerified,
    this.profilePicture,
    required this.isActive,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  Map<String, dynamic> toJson() => _$UserModelToJson(this);
}

