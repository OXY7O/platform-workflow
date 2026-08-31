# Integrasi dengan Platform Provisioning

## Boundary

`platform-workflow` menyediakan reusable technical capability.
`platform-provisioning` memilih capability dari approved bundle, merender thin
caller, membuat repository, menerapkan configuration control, dan melakukan
handoff. Policy, approval, security classification, serta lifecycle tetap dimiliki
`platform-governance`.

## Caller contract

Repository aplikasi hanya menyimpan thin caller dan input yang tervalidasi.
Reusable workflow harus dipin ke full commit SHA. Provisioner tidak boleh menerima
arbitrary command, unpinned action, `secrets: inherit`, permission berlebih, atau
input yang tidak dideklarasikan kontrak.

## Input minimum

- approved family dan profile;
- lifecycle channel;
- typed workload input;
- security dan quality profile hasil assessment;
- immutable workflow reference;
- repository manifest atau lock reference.

## Output minimum

- resolved family/profile dan workflow SHA;
- normalized result dan failure category;
- artifact metadata/digest bila capability menghasilkan artifact;
- safe evidence reference;
- status yang tidak melampaui capability aktual.

`ci-qualified` bukan deployment authorization. Compatibility lane tidak
menghasilkan release artifact atau deployment.

## Certification

Example repository menguji exact combination dan menghasilkan evidence yang dapat
direferensikan certification record. Provisioner dapat menggunakan certification
tersebut hanya bila workflow SHA, profile/lane, input behavior, security behavior,
deployment behavior, dan masa berlakunya sesuai. Jika tidak, provisioning memakai
sandbox validation sebelum merender repository aplikasi.

## Failure boundary

Workflow mengembalikan kategori kegagalan dan safe evidence. Provisioner menentukan
request state, retry, remediation, cleanup, dan handoff berdasarkan governance;
workflow tidak membuat keputusan approval atau risk acceptance.
