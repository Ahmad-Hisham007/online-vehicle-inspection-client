import { describe, it, expect, beforeEach } from "vitest"
import { useInspectionStore } from "@/app/store/inspectionStore"

const initialState = {
  currentStep: 0,
  vehicleInfo: null,
  vinInfo: null,
  inspectionScope: null,
  uploadFields: null,
  reviewAgreement: null,
}

beforeEach(() => {
  sessionStorage.clear()
  useInspectionStore.setState(initialState)
})

describe("inspectionStore", () => {
  it("initial state has currentStep=0 and all fields null", () => {
    const state = useInspectionStore.getState()
    expect(state.currentStep).toBe(0)
    expect(state.vehicleInfo).toBeNull()
    expect(state.vinInfo).toBeNull()
    expect(state.inspectionScope).toBeNull()
    expect(state.uploadFields).toBeNull()
    expect(state.reviewAgreement).toBeNull()
  })

  it("setStep updates currentStep", () => {
    const { setStep } = useInspectionStore.getState()
    setStep(3)
    expect(useInspectionStore.getState().currentStep).toBe(3)
  })

  it("updateVehicleInfo sets vehicleInfo", () => {
    const vehicleData = { licensePlate: "ABC123", mileage: 50000 }
    const { updateVehicleInfo } = useInspectionStore.getState()
    updateVehicleInfo(vehicleData)
    expect(useInspectionStore.getState().vehicleInfo).toEqual(vehicleData)
  })

  it("updateVinInfo sets vinInfo", () => {
    const vinData = {
      vin: "1HGCM82633A123456",
      make: "Honda",
      model: "Accord",
      year: 2020,
      fuelType: "gasoline",
    }
    const { updateVinInfo } = useInspectionStore.getState()
    updateVinInfo(vinData)
    expect(useInspectionStore.getState().vinInfo).toEqual(vinData)
  })

  it("updateInspectionScope sets inspectionScope", () => {
    const scopeData = {
      country: "usa" as const,
      state: "CA",
      companies: ["uber"],
      tiresOlderThan6Years: true,
    }
    const { updateInspectionScope } = useInspectionStore.getState()
    updateInspectionScope(scopeData)
    expect(useInspectionStore.getState().inspectionScope).toEqual(scopeData)
  })

  it("updateUploadField updates a specific field in uploadFields", () => {
    const { updateUploadField } = useInspectionStore.getState()
    updateUploadField("registrationCardPhoto", {
      name: "photo.jpg",
      status: "done",
      progress: 100,
    })
    const uploadFields = useInspectionStore.getState().uploadFields
    expect(uploadFields).not.toBeNull()
    expect(uploadFields!.registrationCardPhoto).toEqual({
      name: "photo.jpg",
      status: "done",
      progress: 100,
    })
  })

  it("updateUploadField adds to existing uploadFields without removing other fields", () => {
    const { updateUploadField } = useInspectionStore.getState()
    updateUploadField("registrationCardPhoto", {
      name: "reg.jpg",
      status: "done",
      progress: 100,
    })
    updateUploadField("odometerPhoto", {
      name: "odo.jpg",
      status: "uploading",
      progress: 50,
    })
    const uploadFields = useInspectionStore.getState().uploadFields
    expect(uploadFields!.registrationCardPhoto).toBeDefined()
    expect(uploadFields!.odometerPhoto).toBeDefined()
    expect(uploadFields!.odometerPhoto!.progress).toBe(50)
  })

  it("updateReviewAgreement sets reviewAgreement", () => {
    const agreementData = {
      userAgreement: true,
      inspectionAgreement: true,
    }
    const { updateReviewAgreement } = useInspectionStore.getState()
    updateReviewAgreement(agreementData)
    expect(useInspectionStore.getState().reviewAgreement).toEqual(agreementData)
  })

  it("reset returns all fields to initial state", () => {
    const { setStep, updateVehicleInfo, reset } = useInspectionStore.getState()
    setStep(5)
    updateVehicleInfo({ licensePlate: "XYZ789", mileage: 10000 })

    reset()

    const state = useInspectionStore.getState()
    expect(state.currentStep).toBe(0)
    expect(state.vehicleInfo).toBeNull()
    expect(state.vinInfo).toBeNull()
    expect(state.inspectionScope).toBeNull()
    expect(state.uploadFields).toBeNull()
    expect(state.reviewAgreement).toBeNull()
  })
})
