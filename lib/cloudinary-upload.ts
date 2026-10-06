import { createCloudinaryUploadSignature } from "@/lib/actions/listing.action"

type CloudinaryUploadResponse = {
	secure_url?: string
	error?: { message?: string }
}

const uploadPhoto = async (file: File) => {
	const { cloudName, apiKey, publicId, signature, timestamp } = await createCloudinaryUploadSignature()
	const formData = new FormData()

	formData.append("file", file)
	formData.append("public_id", publicId)
	formData.append("timestamp", timestamp)
	formData.append("api_key", apiKey)
	formData.append("signature", signature)

	const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
		method: "POST",
		body: formData,
	})
	const payload = (await response.json()) as CloudinaryUploadResponse

	if (!response.ok || !payload.secure_url) {
		throw new Error(payload.error?.message ?? "Photo upload failed. Please try again.")
	}

	return payload.secure_url.replace("/image/upload/", "/image/upload/q_auto,f_auto/")
}

export const uploadListingPhotos = async (files: File[]) => Promise.all(files.map(uploadPhoto))
