export type AccountDetailsArtifactAddress = {
  firstLine: string
  secondLine: string
  state: string
  city: string
  zipCode: string
} | null

export type AccountDetailsArtifactPayload = {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  hasCheckingAccount: boolean
  hasInvestmentAccount: boolean
  address: AccountDetailsArtifactAddress
}
