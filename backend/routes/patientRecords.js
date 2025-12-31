const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../database/user");
const PatientRequestDoctor = require("../database/patientRequestDoctor");
const router = express.Router();

// Get all patient records with search functionality
router.post("/records", async (req, res) => {
  try {
    const token = req.body.token;
    
    // Verify token and check if user is a doctor
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.decode(token);
    
    if (!decoded || decoded.role !== "doctor") {
      return res.status(403).json({ error: "Unauthorized. Doctor access only" });
    }

    const { search, limit = 50, sortBy = "createdAt", sortOrder = "desc" } = req.body;

    // Build query for patients
    let query = { role: "patient" };

    // Add search filter if provided
    if (search && search.trim() !== "") {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { uuid: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Fetch patients
    const patients = await User.find(query)
      .select("email uuid picture ip createdAt updatedAt")
      .sort(sort)
      .limit(parseInt(limit));

    // Get consultation requests for these patients
    const patientEmails = patients.map(p => p.email);
    const consultationRequests = await PatientRequestDoctor.find({
      email: { $in: patientEmails }
    });

    // Map requests to patients
    const patientsWithRequests = patients.map(patient => {
      const requests = consultationRequests.find(r => r.email === patient.email);
      return {
        ...patient.toObject(),
        consultationRequests: requests ? requests.reqeustDoctors.length : 0,
        lastRequest: requests ? requests.updatedAt : null
      };
    });

    res.status(200).json({
      success: true,
      count: patientsWithRequests.length,
      records: patientsWithRequests
    });

  } catch (err) {
    console.error("Error fetching patient records:", err);
    res.status(500).json({
      error: "Failed to fetch patient records",
      details: err.message
    });
  }
});

// Get detailed record for a specific patient
router.post("/records/:email", async (req, res) => {
  try {
    const token = req.body.token;
    const patientEmail = req.params.email;
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.decode(token);
    
    if (!decoded || decoded.role !== "doctor") {
      return res.status(403).json({ error: "Unauthorized. Doctor access only" });
    }

    // Get patient details
    const patient = await User.findOne({ email: patientEmail, role: "patient" });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Get consultation requests
    const requests = await PatientRequestDoctor.findOne({ email: patientEmail });

    // Get doctor details for the requests
    let doctorDetails = [];
    if (requests && requests.reqeustDoctors.length > 0) {
      doctorDetails = await User.find({
        uuid: { $in: requests.reqeustDoctors },
        role: "doctor"
      }).select("uuid email picture");
    }

    res.status(200).json({
      success: true,
      patient: patient.toObject(),
      consultationRequests: {
        count: requests ? requests.reqeustDoctors.length : 0,
        doctors: doctorDetails
      }
    });

  } catch (err) {
    console.error("Error fetching patient record:", err);
    res.status(500).json({
      error: "Failed to fetch patient record",
      details: err.message
    });
  }
});

module.exports = router;
